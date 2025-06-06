import {getAnnotation} from "./string";
import {matchSorter} from "match-sorter";

class Graph {
  constructor() {
    this.nodes = new Set([]);
    this.adjList = {};
    this.items = [];
    this.topicOrder = {};
  }

  addTopicOrder(topic, order) {
    this.topicOrder[topic] = Number(order);
  }

  getTopicOrder(topic) {
    return this.topicOrder[topic] || 0;
  }

  addNode(node) {
    this.nodes.add(node);
    if (!this.adjList[node]) this.adjList[node] = new Set([]);
  }

  addEdge(node1, node2) {
    this.adjList[node1].add(node2);
    this.adjList[node2].add(node1);
  }

  removeEdge(node1, node2) {
    const indexOfNode2 = this.adjList[node1] && this.adjList[node1].indexOf(node2);
    const indexOfNode1 = this.adjList[node2] && this.adjList[node2].indexOf(node1);

    const badIndices = this.adjList[node1] === undefined || this.adjList[node2] === undefined;

    if (badIndices) {
      return "Please pass in valid indices";
    } else {
      this.adjList[node1].splice(indexOfNode2, 1);
      this.adjList[node2].splice(indexOfNode1, 1);
    }
  }

  isType(locale, node, type) {
    return this.items.find(item => getAnnotation(item, type, locale) == node);
  }

  isTable(locale, node) {
    return this.items.filter(item => getAnnotation(item, "table", locale) == node);
  }

  getTopic(startingNode, locale) {
    let found = false;
    let topic = null;
    this.breadthFirstTraversal(startingNode, node => {
      if (this.isType(locale, node, "topic")) {
        if (!found) {
          found = true;
          topic = node;
        }
      }
    });
    return topic;
  }

  getName(node, locale) {
    const item = this.items.find(item => item.name === node);
    const name = item ? getAnnotation(item, "table", locale) : node;
    return name;
  }

  getSubtopic(startingNode, locale) {
    let found = false;
    let subtopic = null;
    this.breadthFirstTraversal(startingNode, node => {
      if (this.isType(locale, node, "subtopic")) {
        if (!found) {
          found = true;
          subtopic = node;
        }
      }
    });
    return subtopic;
  }

  filter(locale, filter) {
    function addItemToSubtopic(map, subtopic, item) {
      if (map.has(subtopic)) {
        // Si el subtopic existe, agregar el ítem a items
        map.get(subtopic).push(item);
      } else {
        // Si el subtopic no existe, crear un nuevo array con el ítem y agregarlo al Map
        map.set(subtopic, [item]);
      }
    }

    const map = new Map();
    const matches = [];

    if (filter !== "") {
      const results = matchSorter(this.items, filter, {
        keys: [
          "name",
          item => getAnnotation(item, "topic", locale) || "",
          item => getAnnotation(item, "subtopic", locale) || "",
          item => getAnnotation(item, "table", locale) || "",
          item => item.name.replace(/_/g, " ")
        ]
      });

      for (const item of results) {
        const topic = getAnnotation(item, "topic", locale);
        const subtopic = getAnnotation(item, "subtopic", locale);
        const title = getAnnotation(item, "table", locale);
        addItemToSubtopic(map, `${topic} - ${subtopic}`, item.name);
        matches.push(item.name);
      }
    }
    return {matches, map};
  }

  depthFirstTraversal(startingNode, func = console.log) {
    if (startingNode === undefined) {
      return "No starting node was provided";
    }
    let nodeStack = [];
    let visitedArr = [];

    nodeStack.push(startingNode);
    visitedArr[startingNode] = true;

    while (nodeStack.length) {
      const current = nodeStack.pop();
      const neighbors = this.adjList[current];
      func(current);

      neighbors.forEach(neighbor => {
        if (!visitedArr[neighbor]) {
          nodeStack.push(neighbor);
          visitedArr[neighbor] = true;
        }
      });
    }
  }

  breadthFirstTraversal(startingNode, func = console.log) {
    if (startingNode === undefined) {
      return "No starting node was provided";
    }

    let nodeStack = [];
    let visitedArr = [];

    nodeStack.push(startingNode);
    visitedArr[startingNode] = true;

    while (nodeStack.length) {
      const current = nodeStack.shift();
      const neighbors = this.adjList[current];
      func(current);

      neighbors.forEach(neighbor => {
        if (!visitedArr[neighbor]) {
          nodeStack.push(neighbor);
          visitedArr[neighbor] = true;
        }
      });
    }
  }
}

export default Graph;
