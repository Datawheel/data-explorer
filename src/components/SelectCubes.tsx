import {Accordion, type AccordionControlProps, Box, Stack, Text} from "@mantine/core";
import React, {type PropsWithChildren, useCallback, useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import yn from "yn";
import type {TesseractCube, TesseractLevel} from "../api/tesseract/schema";
import {useActions, useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {
  selectCubeName,
  selectCurrentQueryParams,
  selectCutItems,
  selectDrilldownItems,
  selectDrilldownMap,
  selectLocale,
  selectMeasureMap
} from "../state/queries";
import {selectOlapCube, selectOlapDimensionItems} from "../state/selectors";
import {selectOlapCubeItems} from "../state/server";
import {pickDefaultDrilldowns} from "../state/utils";
import Graph from "../utils/graph";
import {getAnnotation} from "../utils/string";
import {type CutItem, buildCut, buildDrilldown} from "../utils/structs";
import Results, {useStyles as useLinkStyles} from "./Results";
import {useSideBar} from "./SideBar";
import {useTableRefresh} from "./TableView";
import {useQueryItem} from "../context/query";

export const EMPTY_RESPONSE = {
  data: [],
  types: {},
  url: "",
  status: 200,
  page: {offset: 0, limit: 0, total: 0}
};

export function SelectCube({locale}: {locale: string}) {
  const items = useSelector(selectOlapCubeItems);
  const selectedItem = useSelector(selectOlapCube);

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
  const {measuresActive} = useSettings();
  const {items, selectedItem, locale} = props;
  const {updateMeasure, updateDrilldown, willFetchMembers, updateCut} = useActions();
  const cutItems = useSelector(selectCutItems);

  const cube = useSelector(selectCubeName);
  const itemMap = useSelector(selectMeasureMap);
  const dimensions = useSelector(selectOlapDimensionItems);

  const drilldowns = useSelector(selectDrilldownMap);
  const ditems = useSelector(selectDrilldownItems);

  const createCutHandler = useCallback((level: TesseractLevel) => {
    updateCut(buildCut({...level, active: false}));
  }, []);

  function createDrilldown(level: TesseractLevel, cuts: CutItem[]) {
    if (!drilldowns[level.name] && !ditems.find(d => d.level === level.name)) {
      const drilldown = buildDrilldown({...level, key: level.name, active: true});
      updateDrilldown(drilldown);
      const cut = cuts.find(cut => cut.level === drilldown.level);
      if (!cut) {
        createCutHandler(level);
      }
      willFetchMembers(level.name).then(levelMeta => {
        updateDrilldown({
          ...drilldown,
          members: levelMeta.members
        });
      });

      return drilldown;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cubeParam = params.get("cube");
    if (selectedItem && cube && !cubeParam) {
      const [measure] = Object.values(itemMap);
      const [dimension] = dimensions;
      if (measure && dimension) {
        const drilldowns = pickDefaultDrilldowns(dimensions);
        if (measure && drilldowns.length > 0) {
          const measuresLimit =
            typeof measuresActive !== "undefined" ? measuresActive : Object.values(itemMap).length;
          Object.values(itemMap)
            .slice(0, measuresLimit)
            .forEach(m => {
              updateMeasure({...m, active: true});
            });
          for (const level of drilldowns) {
            createDrilldown(level, cutItems);
          }
        }
      }
    }
  }, [selectedItem, cube, measuresActive]);

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
export type AnnotatedCube = TesseractCube &
  {annotations: {subtopic: string; topic: string; table: string}}[];

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

function getCube(items: AnnotatedCube[], table: string, subtopic: string, locale: string) {
  const cube = items.find(
    item => item.name === table && getAnnotation(item, "subtopic", locale) === subtopic
  );
  return cube;
}

function useBuildGraph(items, locale) {
  const graph = useMemo(() => {
    const graph = new Graph();
    const filteredItems = items
      .map(item => {
        const {name} = item;
        const topic = getAnnotation(item, "topic", locale);
        const topic_order = getAnnotation(item, "topic_order", locale);
        const subtopic = getAnnotation(item, "subtopic", locale);
        const table = getAnnotation(item, "table", locale);
        const hide = getAnnotation(item, "hide_in_ui", locale);

        if (!yn(hide)) {
          graph.addNode(topic);
          if (topic_order) {
            graph.addTopicOrder(topic, topic_order);
          }
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
    return graph;
  }, [items, locale]);

  return {graph};
}

function CubeTree({
  items,
  locale,
  selectedItem
}: {
  items: AnnotatedCube[];
  locale: string;
  selectedItem?: TesseractCube;
}) {
  const {map, input, graph} = useSideBar();
  const {translate: t} = useTranslation();
  const {measuresActive} = useSettings();
  const actions = useActions();
  const query = useSelector(selectCurrentQueryParams);
  const {setQueryEnabled} = useTableRefresh();
  const [isSelectionInProgress, setIsSelectionInProgress] = useState(false);

  const {onChangeCube} = useQueryItem();

  // Define the onSelectCube function
  const onSelectCube = useCallback(
    (table: string, subtopic: string) => {
      // If a selection is already in progress, ignore this click
      if (isSelectionInProgress) return;

      // Set selection in progress to prevent further clicks
      setIsSelectionInProgress(true);

      const cube = items.find(
        item => item.name === table && getAnnotation(item, "subtopic", locale) === subtopic
      );

      if (cube) {
        const {drilldowns, cuts, filters, measures, ...newQuery} = query;
        actions.setLoadingState("FETCHING");
        actions.resetAllParams(newQuery);
        actions.updateResult(EMPTY_RESPONSE);

        actions
          .willSetCube(cube.name, measuresActive)
          .then(() => {
            actions.setLoadingState("SUCCESS");
            setQueryEnabled(true);
          })
          .finally(() => {
            // Re-enable selection when the operation is complete
            setIsSelectionInProgress(false);
          });
      } else {
        // If no cube was found, re-enable selection
        setIsSelectionInProgress(false);
      }
    },
    [items, locale, query, actions, measuresActive, setQueryEnabled, isSelectionInProgress]
  );

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
      onSelectCube={onSelectCube}
      selectedItem={selectedItem}
      getCube={getCube}
      isSelected={isSelected}
      graph={graph}
      locale={locale}
      isSelectionInProgress={isSelectionInProgress}
    />
  ) : (
    graph.items.length > 0 && (
      <RootAccordions
        items={topics}
        graph={graph}
        onSelectCube={onSelectCube}
        selectedItem={selectedItem}
        locale={locale}
        isSelectionInProgress={isSelectionInProgress}
      />
    )
  );
}

function useAccordionValue(key: Keys, locale) {
  const selectedItem = useSelector(selectOlapCube);

  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      const value = getAnnotation(selectedItem, key, locale);
      setValue(`${key}-${value}`);
    }
  }, [key, selectedItem, locale]);

  return {value, setValue};
}

function RootAccordions({items, graph, locale, selectedItem, onSelectCube, isSelectionInProgress}) {
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
                  onSelectCube={onSelectCube}
                  isSelectionInProgress={isSelectionInProgress}
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
  onSelectCube,
  selectedItem,
  graph,
  locale,
  parent,
  isSelectionInProgress
}: {
  item: string;
  selectedItem?: TesseractCube;
  onSelectCube: (table: string, subtopic: string) => void;
  graph: Graph;
  locale: string;
  parent?: string;
  isSelectionInProgress: boolean;
}) {
  const {classes} = useLinkStyles();

  const table = graph.getName(item, locale);
  const subtopic = parent ?? "";

  const handleClick = () => {
    // Only process the click if no selection is in progress
    if (!isSelectionInProgress) {
      onSelectCube(item, subtopic);
    }
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
  onSelectCube: (name: string, subtopic: string) => void;
  locale: string;
  isSelectionInProgress: boolean;
};

function SubtopicAccordion({
  items,
  graph,
  parent,
  onSelectCube,
  selectedItem,
  locale,
  isSelectionInProgress
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
                    onSelectCube={onSelectCube}
                    selectedItem={selectedItem}
                    parent={item}
                    isSelectionInProgress={isSelectionInProgress}
                  />
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
    </Accordion>
  );
}
