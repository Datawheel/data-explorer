import {Box, Divider, Text, createStyles, rem} from "@mantine/core";
import React from "react";
import type {TesseractCube} from "../api";
import type Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
import type {AnnotatedCube} from "./SelectCubes";
import {useSideBar} from "./SideBar";
import {useQueryItem} from "../context/query";

type Props = {
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
};

export default function Results(props: Props) {
  const {graph, selectedItem, locale, getCube, isSelected} = props;
  const {classes} = useStyles();
  const {setExpanded, setInput, map} = useSideBar();
  const {onChangeCube} = useQueryItem();
  const result: React.ReactElement[] = [];

  const results = [...map].flatMap(entry => {
    const [key, items] = entry as [string, string[]];
    const [topic, subtopic] = key.split(" - ");

    // For each topic-subtopic, collect the cubes
    const topicResults = items
      .map(item => {
        const cube = getCube(graph.items, item, subtopic, locale);
        if (!cube) return null;
        const table = getAnnotation(cube, "table", locale);
        const isItemSelected = isSelected(selectedItem, cube);

        const handleClick = () => {
          onChangeCube(item, subtopic);
          setExpanded(false);
          setInput("");
        };

        return (
          <Text
            key={cube.name}
            component="a"
            fz="xs"
            className={isItemSelected ? `${classes.link} ${classes.linkActive}` : classes.link}
            sx={theme => ({
              opacity: 1,
              cursor: "pointer",
              transition: "opacity 0.2s ease",
              pointerEvents: "auto"
            })}
            onClick={handleClick}
          >
            {table}
          </Text>
        );
      })
      .filter(Boolean); // Remove nulls

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
