import React from "react";
import {Text, Divider, Box} from "@mantine/core";
import {createStyles, rem} from "@mantine/core";
import {type PlainCube} from "@datawheel/olap-client";
import Graph from "../utils/graph";
import {AnnotatedCube} from "./SelectCubes";
import {useSideBar} from "./SideBar";

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
  const result: React.ReactElement[] = [];
  if (map) {
    for (let [key, items] of map) {
      const [topic, subtopic] = key.split(" - ");
      const component = (
        <div key={key}>
          <Divider my="xs" label={key} />
          {items.map(item => (
            <Text
              key={item}
              component="a"
              fz="sm"
              className={
                isSelected(selectedItem, getCube(graph.items, item, subtopic, locale))
                  ? `${classes.link} ${classes.linkActive}`
                  : classes.link
              }
              onClick={() => {
                onSelectCube(item, subtopic);
                setExpanded(false);
                setInput("");
              }}
            >
              {item}
            </Text>
          ))}
        </div>
      );
      result.push(component);
    }
  }
  return result;
}

export const useStyles = createStyles(theme => ({
  category: {
    marginBottom: `calc(${theme.spacing.xl} * 1.2)`
  },

  categoryCollapsed: {
    marginBottom: 0
  },

  header: {
    ...theme.fn.focusStyles(),
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    width: `calc(100% + ${theme.spacing.md})`,
    color: theme.colorScheme === "dark" ? theme.white : theme.colors.gray[7],
    height: rem(32),
    border: 0,
    padding: `0 ${theme.spacing.md}`,
    paddingLeft: 0,
    cursor: "pointer"
  },

  icon: {
    width: rem(15),
    height: rem(15),
    marginRight: theme.spacing.md,
    transform: "rotate(0deg)",
    transition: "transform 150ms ease"
  },

  iconCollapsed: {
    transform: "rotate(-90deg)"
  },

  innerCategory: {
    paddingTop: rem(15)
  },

  innerCategoryIcon: {
    marginRight: rem(10),
    width: rem(14),
    height: rem(14)
  },

  innerCategoryTitle: {
    position: "relative",
    paddingLeft: rem(23),
    marginLeft: rem(7),
    marginBottom: rem(5),
    borderLeft: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3]
    }`,
    height: rem(34),
    display: "flex",
    alignItems: "center",
    fontSize: theme.fontSizes.xs,
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
    color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6],
    borderTopRightRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,

    "&::after": {
      content: '""',
      position: "absolute",
      bottom: rem(-5),
      left: rem(-1),
      height: rem(5),
      width: rem(1),
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3]
    }
  },

  link: {
    ...theme.fn.focusStyles(),
    WebkitTapHighlightColor: "transparent",
    outline: 0,
    display: "block",
    textDecoration: "none",
    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[7],
    paddingLeft: rem(23),
    height: rem(44),
    lineHeight: rem(44),
    fontSize: theme.fontSizes.md,
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
  },

  title: {
    userSelect: "none",
    fontWeight: 700,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    lineHeight: 1,
    paddingTop: rem(4),
    color: theme.colorScheme === "dark" ? theme.white : theme.colors.gray[7],
    letterSpacing: rem(0.5),
    wordSpacing: 1
  }
}));

export default Results;
