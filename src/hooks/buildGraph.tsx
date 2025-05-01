import {useMemo} from "react";
import yn from "yn";
import Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
import {useServerSchema} from "./useQueryApi";
import {getValues} from "../utils/object";

export default function useBuildGraph(locale: string): Graph {
  const {data: schema, isLoading: schemaLoading} = useServerSchema();

  const items = getValues(schema?.cubeMap ?? {});

  const graph = useMemo(() => {
    const graph = new Graph();
    const filteredItems = items
      .map(item => {
        const {name} = item;
        const topic = getAnnotation(item, "topic", locale);
        const topic_order = getAnnotation(item, "topic_order", locale);
        const subtopic = getAnnotation(item, "subtopic", locale);
        const table = getAnnotation(item, "table", locale);
        const hide = getAnnotation(item, "hide_in_ui", locale);

        if (!yn(hide)) {
          graph.addNode(topic);
          graph.addNode(subtopic);
          graph.addNode(name);
          graph.addEdge(topic, subtopic);
          graph.addEdge(subtopic, name);
          if (topic_order) {
            graph.addTopicOrder(topic, topic_order);
          }
          return item;
        }

        return null;
      })
      .filter(Boolean);
    graph.items = filteredItems;
    return graph;
  }, [items, locale]);

  return graph;
}
