import {Box, Divider, Text, createStyles, rem} from "@mantine/core";
import React from "react";
import type {TesseractCube} from "../api";
import type Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
import type {AnnotatedCube} from "./SelectCubes";
import {useSideBar} from "./SideBar";

type Props = {
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
};

function Results(props: Props) {
  const {onSelectCube, graph, selectedItem, locale, getCube, isSelected} = props;
  const {classes} = useStyles();
  const {setExpanded, setInput, map} = useSideBar();
  const result: React.ReactElement[] = [];

  if (map) {
    for (let [key, items] of map) {
      const [topic, subtopic] = key.split(" - ");

      const component = (
        <div key={key}>
          <Divider my="xs" label={key} />
          {items.map(item => {
            const cube = getCube(graph.items, item, subtopic, locale);
            const table = getAnnotation(cube, "table", locale);

            return (
              <Text
                key={cube.name}
                component="a"
                fz="xs"
                className={
                  isSelected(selectedItem, cube)
                    ? `${classes.link} ${classes.linkActive}`
                    : classes.link
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
          })}
        </div>
      );
      result.push(component);
    }
  }
  return <Box px="sm">{result}</Box>;
}

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
    color: theme.colorScheme === "dark" ? theme.colors[theme.primaryColor][1] : theme.white,
    fontWeight: 500
  }
}));

export default Results;
