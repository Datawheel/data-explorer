import {useMemo} from "react";
import type Graph from "../utils/graph";

export function useCubeSearch(
  graph: Graph,
  input: string,
  locale: string
): {
  results: string[];
  map: Map<string, string[]>;
} {
  const results = useMemo(() => {
    if (graph.items.length > 0) {
      const {matches, map} = graph.filter(locale, input);
      return {
        results: matches,
        map: map
      };
    }
    return {
      results: [],
      map: new Map()
    };
  }, [graph, input, locale]);

  return results;
}
