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
  isSelectionInProgress: boolean;
}) {
  const {onSelectCube, graph, selectedItem, locale, getCube, isSelected, isSelectionInProgress} =
    props;
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
      const isItemSelected = isSelected(selectedItem, cube);

      const handleClick = () => {
        // Only process the click if no selection is in progress
        if (!isSelectionInProgress) {
          onSelectCube(item, subtopic);
          setExpanded(false);
          setInput("");
        }
      };

      return (
        <Text
          key={cube.name}
          component="a"
          fz="xs"
          className={isItemSelected ? `${classes.link} ${classes.linkActive}` : classes.link}
          sx={t => ({
            opacity: isSelectionInProgress ? 0.5 : 1,
            cursor: isSelectionInProgress ? "not-allowed" : "pointer",
            transition: "opacity 0.2s ease",
            pointerEvents: isSelectionInProgress ? "none" : "auto"
          })}
          onClick={handleClick}
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
export const useStyles = createStyles(t => ({
  link: {
    ...t.fn.focusStyles(),
    WebkitTapHighlightColor: "transparent",
    outline: 0,
    display: "block",
    textDecoration: "none",
    // color: t.colorScheme === "dark" ? t.white : t.colors.dark[6],
    color: t.colorScheme === "dark" ? t.colors.dark[1] : t.colors.gray[7],

    padding: t.spacing.xs,
    minHeight: rem(20),
    fontSize: t.fontSizes.sm,
    whiteSpace: "wrap",
    cursor: "pointer",
    "&:hover": {
      backgroundColor:
        t.colorScheme === "dark" ? t.colors[t.primaryColor][4] : t.colors[t.primaryColor][4]
    }
  },
  linkActive: {
    backgroundColor:
      t.colorScheme === "dark"
        ? t.fn.rgba(t.colors[t.primaryColor][9], 0.45)
        : t.colors[t.primaryColor][4],
    color: t.white,
    fontWeight: 500
  }
}));
