import {useCallback, useEffect} from "react";
import type {TesseractCube} from "../api";
import {queryParamsToRequest, requestToQueryParams} from "../api/tesseract/parse";
import {selectCurrentQueryItem} from "../state/queries";
import {selectOlapCubeMap} from "../state/server";
import {useSelector} from "../state/store";
import {type QueryItem, type QueryParams, buildQuery} from "../utils/structs";
import {isValidQuery} from "../utils/validation";

/** */
export function serializePermalink(item: QueryItem): string {
  const request = queryParamsToRequest(item.params);
  const search = new URLSearchParams(
    Object.entries(request).filter(entry => entry[1] != null && entry[1] !== "")
  );
  search.set("panel", item.panel || "table");
  if (item.chart !== "" && item.chart){
    search.set("chart", item.chart)
  }
  return search.toString();
}

/** */
export function parsePermalink(cube: TesseractCube, value: string | URLSearchParams): QueryItem {
  const search = new URLSearchParams(value);

  const params = requestToQueryParams(cube, search);

  return buildQuery({
    panel: search.get("panel") || "table",
    chart: search.get("chart") || "",
    params
  });
}

/** */
export function usePermalink(
  isEnabled: boolean | undefined,
  options: {
    onChange(state: Partial<QueryParams>): void;
  }
) {
  const cubeMap = useSelector(selectOlapCubeMap);
  const queryItem = useSelector(selectCurrentQueryItem);

  const listener = useCallback(
    (evt: PopStateEvent) => {
      evt.state && options.onChange(evt.state);
    },
    [options.onChange]
  );

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isEnabled) {
      window.addEventListener("popstate", listener);
      return () => window.removeEventListener("popstate", listener);
    }
  }, [isEnabled, listener]);

  useEffect(() => {
    const {isDirty, panel, params} = queryItem;
    // We want to update the Permalink only when we are sure the current Query
    // is successful: this is when `isDirty` changes from `false` to `true`
    if (!isEnabled || isDirty || !cubeMap[params.cube]) return;
    const currPermalink = window.location.search.slice(1);
    const nextPermalink = serializePermalink(queryItem);

    if (currPermalink !== nextPermalink) {
      const nextLocation = `${window.location.pathname}?${nextPermalink}`;
      const oldPanel = new URLSearchParams(window.location.search).get("panel");
      const oldChart = new URLSearchParams(window.location.search).get("chart");
      // If only the panel or chartchanged, use replaceState
      if (
        (oldPanel && oldPanel[1] !== panel)
        || (oldChart && oldChart[1] !== queryItem.chart)
      ) {
        window.history.replaceState(queryItem, "", nextLocation);
      } else {
        window.history.pushState(queryItem, "", nextLocation);
      }
    }
  }, [cubeMap, queryItem, isEnabled]);

  return null;
}

export function useUpdatePermaLink({
  isFetched,
  cube,
  enabled,
  isLoading
}: {
  isFetched: boolean;
  cube: string;
  enabled: boolean;
  isLoading: boolean;
}) {
  const queryItem = useSelector(selectCurrentQueryItem);
  useEffect(() => {
    if (isFetched && cube && enabled && !isLoading) {
      const currPermalink = window.location.search.slice(1);
      const nextPermalink = serializePermalink(queryItem);
      if (currPermalink !== nextPermalink) {
        const nextLocation = `${window.location.pathname}?${nextPermalink}`;
        window.history.pushState(queryItem, "", nextLocation);
      }
    }
  }, [isFetched, cube, queryItem, enabled, isLoading]);
}

export function useKey(params: Partial<QueryParams> = {}) {
  const queryItem = useSelector(selectCurrentQueryItem);
  if (isValidQuery(queryItem.params)) {
    return serializePermalink({...queryItem, params: {...queryItem.params, ...params}});
  }
  return false;
}
