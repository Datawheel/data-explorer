import {useCallback} from "react";
import type {TesseractCube} from "../api";
import {queryParamsToRequest, requestToQueryParams} from "../api/tesseract/parse";
import {selectCurrentQueryItem} from "../state/queries";
import {selectOlapCubeMap} from "../state/server";
import {useSelector} from "../state/store";
import {type QueryItem, type QueryParams, buildQuery} from "../utils/structs";
import {isValidQuery} from "../utils/validation";
import {useNavigate} from "react-router-dom";

/** */
export function serializePermalink(item: QueryItem): string {
  console.log("serializing permalink", item);

  const request = queryParamsToRequest(item.params);
  const search = new URLSearchParams(
    Object.entries(request).filter(entry => entry[1] != null && entry[1] !== "")
  );
  search.set("panel", item.panel || "table");
  if (item.chart !== "" && item.chart) {
    search.set("chart", item.chart);
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

export function useUpdateUrl() {
  const navigate = useNavigate();
  const queryItem = useSelector(selectCurrentQueryItem);
  return useCallback(
    (query?: QueryItem) => {
      const currPermalink = window.location.search.slice(1);
      const q = query ?? queryItem;
      const nextPermalink = serializePermalink(q);
      if (currPermalink !== nextPermalink) {
        navigate(`?${nextPermalink}`, {replace: true});
      }
    },
    [navigate, queryItem]
  );
}

export function useKey(params: Partial<QueryParams> = {}) {
  const queryItem = useSelector(selectCurrentQueryItem);
  if (isValidQuery(queryItem.params)) {
    return serializePermalink({...queryItem, params: {...queryItem.params, ...params}});
  }
  return false;
}
