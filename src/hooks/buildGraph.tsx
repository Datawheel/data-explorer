import React, {useMemo} from "react";
import yn from "yn";

import {useSelector} from "../state";
import {selectOlapCubeItems} from "../state/server";

import Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";

export default function useBuildGraph(locale: string): Graph {
  const cubes = useSelector(selectOlapCubeItems);

  const graph = useMemo(() => {
    const graph = new Graph();
    const filteredItems = cubes
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
  }, [cubes, locale]);

  return graph;
}
