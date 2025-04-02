import debounce from "lodash.debounce";
import {useState, useEffect, useMemo} from "react";
import {useSelector} from "react-redux";
import {useQuery} from "@tanstack/react-query";

import {selectCurrentQueryItem, selectLocale} from "../../state/queries";
import {selectLoadingState} from "../../state/loading";
import {useKey} from "../../hooks/permalink";
import {useActions} from "../../hooks/settings";

import {selectDrilldownItems, selectMeasureItems} from "../../state/queries";
import {useFetchQuery} from "../../hooks/useQueryApi";

type ApiResponse = {
  data: any;
  types: any;
  page: {
    total: number;
  };
};

export function useFinalUniqueKeys() {
  const drilldowns = useSelector(selectDrilldownItems);
  const measures = useSelector(selectMeasureItems);
  const finalUniqueKeys = useMemo(
    () =>
      [
        ...measures.map(m => (m.active ? m.name : null)),
        ...drilldowns.map(d => (d.active ? d.level : null))
      ].filter(a => a !== null),
    [measures, drilldowns]
  );
  return finalUniqueKeys;
}

export function useVizbuilderDataOld() {
  const columns = useFinalUniqueKeys();
  const {code: locale} = useSelector(selectLocale);
  const permaKey = useKey();
  const loadingState = useSelector(selectLoadingState);
  const actions = useActions();
  const enabled = Boolean(columns.length);
  const initialKey = permaKey ? [permaKey] : permaKey;

  const [filterKeydebouced, setDebouncedTerm] = useState<
    string | boolean | (string | boolean | number)[]
  >(initialKey);

  useEffect(() => {
    if (!enabled && permaKey) return;
    const handler = debounce(
      () => {
        const term = [permaKey];
        setDebouncedTerm(term);
      },
      loadingState.loading ? 0 : 800
    );
    handler();
    return () => handler.cancel();
  }, [enabled, locale, loadingState.loading, permaKey]);

  const query = useQuery<ApiResponse>({
    queryKey: ["table", filterKeydebouced],
    queryFn: () =>
      actions.willFetchQuery({withoutPagination: true}).then(result => {
        return result;
      }),
    staleTime: 300000,
    enabled: enabled && !!filterKeydebouced
  });

  return query;
}

export function useVizbuilderData() {
  const queryItem = useSelector(selectCurrentQueryItem);
  const queryLink = queryItem.link;

  const query = useFetchQuery(queryItem.params, queryLink, {
    withoutPagination: true
  });
  console.log("me llama useVizbuilderData");
  return query;
}
