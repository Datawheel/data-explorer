import { useMemo } from "react";
import Graph from "../utils/graph";
import { useSelector } from "../state";
import { selectLocale } from "../state/queries";

interface CubeSearchResult {
    results: string[];
    map: Map<string, string[]>;
}
export default function useCubeSearch(input: string, graph: Graph): CubeSearchResult {
    const {code: locale} = useSelector(selectLocale);
    const results = useMemo(() => {
    if (graph.items.length > 0) {
      const {matches, map} = graph.filter(locale, input);
      return {
        results: matches,
        map: map
      }
    } return {
        results: [],
        map: new Map(),
    }
  }, [input, graph]);

  return results;
}