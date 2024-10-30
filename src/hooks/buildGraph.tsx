import React, {useMemo} from "react";
import yn from "yn";

import { useSelector } from "../state";
import { selectOlapCubeItems } from "../state/server";
import { selectLocale } from "../state/queries";

import Graph from "../utils/graph";
import { getAnnotation } from "../utils/string";


export default function useBuildGraph(locale: string): Graph {
    const items = useSelector(selectOlapCubeItems);
    const graph = useMemo(() => {
      const graph = new Graph();
      const filteredItems = items
        .map(item => {
          const {name} = item;
          const topic = getAnnotation(item, "topic", locale);
          const subtopic = getAnnotation(item, "subtopic", locale);
          const table = getAnnotation(item, "table", locale);
          const hide = getAnnotation(item, "hide_in_ui", locale);
          if (!yn(hide)) {
            graph.addNode(topic);
            graph.addNode(subtopic);
            graph.addNode(name);
            graph.addEdge(topic, subtopic);
            graph.addEdge(subtopic, name);
            return item;
          }
  
          return null;
        })
        .filter(Boolean);
      graph.items = filteredItems;
      return graph
    }, [items, locale]);
  
    return graph;
  }