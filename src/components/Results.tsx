import {Box, Divider, Text, createStyles, rem} from "@mantine/core";
import React from "react";
import type {TesseractCube} from "../api";
import type Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
import type {AnnotatedCube} from "./SelectCubes";
import {useSideBar} from "./SideBar";
import {filterMap} from "../utils/array";

export function Results(props: {
  onSelectCube: (name: string, subtopic: string) => void;
  selectedItem?: TesseractCube;
  graph: Graph;
  locale: string;
  getCube: (
    items: AnnotatedCube[],
    table: string,
    subtopic: string,
    locale: string
  ) => AnnotatedCube | undefined;
  isSelected: (selectedItem?: TesseractCube, currentItem?: AnnotatedCube) => boolean | undefined;
}) {
  const {onSelectCube, graph, selectedItem, locale, getCube, isSelected} = props;
  const {classes} = useStyles();
  const {map, setExpanded, setInput} = useSideBar();

  const results = [...map].flatMap(entry => {
    const [key, items] = entry as [string, string[]];
    const [topic, subtopic] = key.split(" - ");

    // We need to filter out the cases where the cube can't be found
    const topicResults = filterMap(items, item => {
      const cube = getCube(graph.items, item, subtopic, locale);
      if (!cube) return null;
      const table = getAnnotation(cube, "table", locale);
      return (
        <Text
          key={cube.name}
          component="a"
          fz="xs"
          className={
            isSelected(selectedItem, cube) ? `${classes.link} ${classes.linkActive}` : classes.link
          }
          onClick={() => {
            onSelectCube(item, subtopic);
            setExpanded(false);
            setInput("");
          }}
        >
          {table}
        </Text>
      );
    });

    // Skip topic divider if there's no results on it
    if (topicResults.length === 0) return [];
    // else, return divider and results in the same array, flatMap will combine them
    const label = `${topic} - ${subtopic}`;
    return [<Divider key={label} my="xs" label={label} />, ...topicResults];
  });

  return <Box px="sm">{results.length ? results : "No results"}</Box>;
}

Results.displayName = "SearchResults";

export const useStyles = createStyles(theme => ({
  link: {
    ...theme.fn.focusStyles(),
    WebkitTapHighlightColor: "transparent",
    outline: 0,
    display: "block",
    textDecoration: "none",
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[7],
    padding: theme.spacing.xs,
    minHeight: rem(20),
    fontSize: theme.fontSizes.sm,
    whiteSpace: "wrap",
    cursor: "pointer",
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.45)
          : theme.fn.rgba(theme.colors[theme.primaryColor][4], 0.45)
    }
  },

  linkActive: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.45)
        : theme.colors[theme.primaryColor][4],
    color: theme.white,
    fontWeight: 500
  }
}));
