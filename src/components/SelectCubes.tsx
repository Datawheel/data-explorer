import {Accordion, type AccordionControlProps, Box, Skeleton, Stack, Text} from "@mantine/core";
import React, {type PropsWithChildren, useEffect, useMemo, useState} from "react";
import type {TesseractCube} from "../api/tesseract/schema";
import {useTranslation} from "../hooks/translation";
import Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
<<<<<<< HEAD
import Results, {useStyles as useLinkStyles} from "./Results";
=======
import {type CutItem, buildCut, buildDrilldown} from "../utils/structs";
import {Results, useStyles as useLinkStyles} from "./Results";
>>>>>>> develop
import {useSideBar} from "./SideBar";
import {useQueryItem} from "../context/query";
import {useCubeItems, useSelectedItem} from "../hooks/useQueryApi";

export const EMPTY_RESPONSE = {
  data: [],
  types: {},
  url: "",
  status: 200,
  page: {offset: 0, limit: 0, total: 0}
};

const loadingCubes = Array.from({length: 10}, (v, index) => ({
  id: `loading-cube-${index}`
}));

export function SelectCubes({locale}: {locale: string}) {
  const items = useCubeItems();
  const selectedItem = useSelectedItem();
  const {schemaLoading} = useQueryItem();

  if (schemaLoading) {
    return loadingCubes.map(cube => <Skeleton m={15} h={40} w={"100%"} animate key={cube.id} />);
  }

  if (items.length === 1) {
    return null;
  }

  return <SelectCubeInternal items={items} selectedItem={selectedItem} locale={locale} />;
}

function SelectCubeInternal(props: {
  items: TesseractCube[];
  selectedItem: TesseractCube | undefined;
  locale: string;
}) {
  const {items, selectedItem, locale} = props;

  return (
    <Stack id="dex-select-cube" spacing={"xs"} w={"100%"}>
      <CubeTree items={items as AnnotatedCube[]} locale={locale} selectedItem={selectedItem} />
    </Stack>
  );
}

function AccordionControl(props: AccordionControlProps) {
  return (
    <Box sx={{display: "flex", alignItems: "center"}}>
      <Accordion.Control {...props} />
    </Box>
  );
}

type Keys = "subtopic" | "topic" | "table";
export type AnnotatedCube = TesseractCube & {
  annotations: {subtopic: string; topic: string; table: string};
};

export function getKeys(
  items: AnnotatedCube[],
  k: Keys,
  locale: string,
  filter?: {key: Keys; value: string}
): string[] {
  let cubes = items;

  if (filter) {
    cubes = items.filter(i => i.annotations[filter.key] === filter.value);
  }
  const keys = cubes.reduce((prev: Set<string>, curr) => {
    const key = getAnnotation(curr, k, locale);
    if (key) {
      prev.add(key);
      return prev;
    }
    return prev;
  }, new Set<string>());

  return Array.from(keys);
}

function isSelected(selectedItem, currentItem) {
  if (selectedItem && currentItem) {
    return selectedItem.name === currentItem.name;
  }
}

function getCube(items: AnnotatedCube[], name: string, subtopic: string, locale: string) {
  const cube = items.find(
    item => item.name === name && getAnnotation(item, "subtopic", locale) === subtopic
  );
  return cube;
}

function CubeTree({
  locale,
  selectedItem
}: {
  items: AnnotatedCube[];
  locale: string;
  selectedItem?: TesseractCube;
}) {
  const {map, input, graph} = useSideBar();
  const {translate: t} = useTranslation();

  let topics = useMemo(
    () => getKeys(graph.items as AnnotatedCube[], "topic", locale),
    [graph.items, locale]
  );

  if (input.length > 0 && map && !(map.size > 0)) {
    // there is a query but not results in map
    return (
      <Text ta="center" fz="xs" my="sm" italic>
        {t("params.label_no_results")}
      </Text>
    );
  }

  return map && map.size > 0 ? (
    <Results
      selectedItem={selectedItem}
      getCube={getCube}
      isSelected={isSelected}
      graph={graph}
      locale={locale}
    />
  ) : (
    graph.items.length > 0 && (
      <RootAccordions items={topics} graph={graph} selectedItem={selectedItem} locale={locale} />
    )
  );
}

function useAccordionValue(key: Keys, locale) {
  const selectedItem = useSelectedItem();
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      const value = getAnnotation(selectedItem, key, locale);
      setValue(`${key}-${value}`);
    }
  }, [key, selectedItem, locale]);

  return {value, setValue};
}

function RootAccordions({items, graph, locale, selectedItem}) {
  const {value, setValue} = useAccordionValue("topic", locale);
  return (
    <Accordion
      value={value}
      onChange={setValue}
      key={"topic"}
      chevronPosition="left"
      w={"100%"}
      styles={t => ({
        control: {
          background: t.colorScheme === "dark" ? t.colors.dark[7] : t.colors.gray[1],
          borderLeft: 6,
          borderLeftColor: "transparent",
          borderLeftStyle: "solid",
          fontSize: t.fontSizes.md,
          "&[data-active]": {
            borderLeft: 6,
            borderLeftColor: t.fn.primaryColor(),
            borderLeftStyle: "solid",
            color: t.fn.primaryColor()
          }
        },
        content: {
          padding: 0,
          "& > *": {
            marginLeft: 0
          }
        }
      })}
    >
      {items
        .sort((a, b) => graph.topicOrder[a] - graph.topicOrder[b])
        .map(item => {
          return (
            <Accordion.Item value={`topic-${item}`} key={`topic-${item}`}>
              <AccordionControl>{item}</AccordionControl>
              <Accordion.Panel>
                <SubtopicAccordion
                  graph={graph}
                  parent={item}
                  items={graph.adjList[item]}
                  key={item}
                  locale={locale}
                  selectedItem={selectedItem}
                />
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
    </Accordion>
  );
}

function CubeButton({
  item,
  selectedItem,
  graph,
  locale,
  parent
}: {
  item: string;
  selectedItem?: TesseractCube;
  graph: Graph;
  locale: string;
  parent?: string;
}) {
  const {onChangeCube, membersLoading, schemaLoading} = useQueryItem();
  const {classes} = useLinkStyles();
  const isSelectionInProgress = membersLoading || schemaLoading;
  const table = graph.getName(item, locale);
  const subtopic = parent ?? "";

  const handleClick = () => {
    onChangeCube(item, subtopic);
  };

  const isItemSelected = isSelected(selectedItem, getCube(graph.items, item, subtopic, locale));

  return (
    <Text
      key={`table-${item}`}
      fz="xs"
      pl={60}
      maw={"100%"}
      pr="md"
      component="a"
      className={isItemSelected ? `${classes.link} ${classes.linkActive}` : classes.link}
      sx={t => ({
        backgroundColor: isItemSelected
          ? t.fn.primaryColor()
          : t.colorScheme === "dark"
          ? t.colors.dark[6]
          : t.colors.gray[3],
        overflow: "hidden",
        opacity: isSelectionInProgress ? 0.5 : 1,
        cursor: isSelectionInProgress ? "not-allowed" : "pointer",
        transition: "opacity 0.2s ease",
        pointerEvents: isSelectionInProgress ? "none" : "auto"
      })}
      onClick={handleClick}
    >
      {table ?? item}
    </Text>
  );
}

type NestedAccordionType = {
  items: string[];
  graph: any;
  parent?: string;
  selectedItem?: TesseractCube;
  locale: string;
};

function SubtopicAccordion({
  items,
  graph,
  parent,
  selectedItem,
  locale
}: PropsWithChildren<NestedAccordionType>) {
  const {value, setValue} = useAccordionValue("subtopic", locale);

  return (
    <Accordion
      id="data-accordion-topic"
      value={value}
      onChange={setValue}
      key={`subtopic-${parent}`}
      chevronPosition="left"
      w={300}
      ml={0}
      styles={t => ({
        control: {
          fontSize: t.fontSizes.sm,
          background: t.colorScheme === "dark" ? t.colors.dark[7] : t.colors.gray[2],
          borderLeft: 18,
          borderLeftColor: "transparent",
          borderLeftStyle: "solid",
          "&[data-active] span": {
            color: t.fn.primaryColor()
          }
        },
        content: {
          padding: 0
        }
      })}
    >
      {[...items]
        .sort((a, b) => a.localeCompare(b, locale, {sensitivity: "base"}))
        .map((item, index) => {
          const filtered = [...graph.adjList[item]].filter(value => value !== parent);

          return (
            <Accordion.Item value={`subtopic-${item}`} key={`subtopic-${item}-${index}`}>
              <AccordionControl>{item}</AccordionControl>
              <Accordion.Panel>
                {filtered.map((table, index) => (
                  <CubeButton
                    key={index}
                    graph={graph}
                    item={table}
                    locale={locale}
                    selectedItem={selectedItem}
                    parent={item}
                  />
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
    </Accordion>
  );
}
