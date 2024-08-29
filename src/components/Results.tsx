import React from "react";
import {Text, Divider, Box} from "@mantine/core";
import {createStyles, rem} from "@mantine/core";
import {type PlainCube} from "@datawheel/olap-client";
import Graph from "../utils/graph";
import {AnnotatedCube} from "./SelectCubes";
import {useSideBar} from "./SideBar";
import {useSelectCube} from "../hooks/useSelectCube";

type Props = {
  onSelectCube: (name: string, subtopic: string) => void;
  selectedItem?: PlainCube;
  graph: Graph;
  locale: string;
  getCube: (
    items: AnnotatedCube[],
    table: string,
    subtopic: string,
    locale: string
  ) => AnnotatedCube | undefined;
  isSelected: (selectedItem?: PlainCube, currentItem?: AnnotatedCube) => boolean | undefined;
};

function Results(props: Props) {
  const {onSelectCube, graph, selectedItem, locale, getCube, isSelected} = props;
  const {classes} = useStyles();
  const {setExpanded, setInput, map} = useSideBar();
  const callback = useSelectCube(onSelectCube);
  const result: React.ReactElement[] = [];

  if (map) {
    for (let [key, items] of map) {
      const [topic, subtopic] = key.split(" - ");

      const component = (
        <div key={key}>
          <Divider my="xs" label={key} />
          {items.map(item => {
            const cube = getCube(graph.items, item, subtopic, locale);
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
                  callback(item, subtopic)();
                  setExpanded(false);
                  setInput("");
                }}
              >
                {item}
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
          ? theme.fn.rgba(theme.colors.blue[9], 0.45)
          : theme.fn.rgba(theme.colors.blue[4], 0.45)
    }
  },

  linkActive: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.fn.rgba(theme.colors.blue[9], 0.45)
        : theme.colors.blue[4],
    color: theme.colorScheme === "dark" ? theme.colors.blue[1] : theme.white,
    fontWeight: 500
  }
}));

export default Results;
