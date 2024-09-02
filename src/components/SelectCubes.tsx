import {type PlainCube} from "@datawheel/olap-client";
import {Stack, Text, Box, Accordion, AccordionControlProps} from "@mantine/core";
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCutItems, selectLocale, selectMeasureMap} from "../state/queries";
import {selectOlapCube, selectOlapDimensionItems} from "../state/selectors";
import {selectOlapCubeItems} from "../state/server";
import {selectCubeName} from "../state/queries";
import {getAnnotation} from "../utils/string";
import {buildDrilldown, buildCut, MeasureItem, CutItem} from "../utils/structs";
import type {PlainLevel} from "@datawheel/olap-client";
import {useSideBar} from "./SideBar";
import Graph from "../utils/graph";
import Results, {useStyles as useLinkStyles} from "./Results";
import yn from "yn";
import {deriveDrilldowns} from "../state/utils";
import {useSelectCube} from "../hooks/useSelectCube";
import {stringifyName} from "../utils/transform";

export function SelectCube() {
  const items = useSelector(selectOlapCubeItems);
  const selectedItem = useSelector(selectOlapCube);

  if (items.length === 1) {
    return null;
  }

  return <SelectCubeInternal items={items} selectedItem={selectedItem} />;
}

function SelectCubeInternal(props: {items: PlainCube[]; selectedItem: PlainCube | undefined}) {
  const {items, selectedItem} = props;
  const {translate: t} = useTranslation();
  const {code: locale} = useSelector(selectLocale);
  const {updateMeasure, updateDrilldown, willFetchMembers, updateCut} = useActions();
  const cutItems = useSelector(selectCutItems);

  const cube = useSelector(selectCubeName);
  const itemMap = useSelector(selectMeasureMap);
  const dimensions = useSelector(selectOlapDimensionItems);

  const createCutHandler = React.useCallback((level: PlainLevel) => {
    const cutItem = buildCut({...level});
    cutItem.active = false;
    updateCut(cutItem);
  }, []);

  function createDrilldown(level: PlainLevel, cuts: CutItem[]) {
    const drilldown = buildDrilldown({...level, key: stringifyName(level), active: true});
    updateDrilldown(drilldown);
    const cut = cuts.find(cut => cut.uniqueName === drilldown.uniqueName);
    if (!cut) {
      createCutHandler({...level, key: stringifyName(level)});
    }

    willFetchMembers({...level, level: level.name}).then(members => {
      const dimension = dimensions.find(dim => dim.name === level.dimension);
      if (!dimension) return;
      updateDrilldown({
        ...drilldown,
        dimType: dimension.dimensionType,
        memberCount: members.length,
        members
      });
    });
    return drilldown;
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cubeParam = params.get("cube");
    if (selectedItem && cube && !cubeParam) {
      const [measure] = Object.values(itemMap);
      const [dimension] = dimensions;
      if (measure && dimension) {
        updateMeasure({...measure, active: true});
        const drilldowns = deriveDrilldowns(dimensions);
        if (measure && drilldowns.length > 0) {
          updateMeasure({...measure, active: true});
          for (const level of drilldowns) {
            createDrilldown(level, cutItems);
          }
        }
      }
    }
  }, [selectedItem, cube]);

  return (
    <Stack id="select-cube" spacing={"xs"} w={"100%"}>
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
export type AnnotatedCube = PlainCube &
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

function useBuildGraph(items, locale, graph, setGraph) {
  useEffect(() => {
    const graph = new Graph();
    items.map(item => {
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
      }

      return item;
    });

    graph.items = items;
    setGraph(graph);
  }, [items, locale, setGraph]);
  return {graph};
}

function CubeTree({
  items,
  locale,
  selectedItem
}: {
  items: AnnotatedCube[];
  locale: string;
  selectedItem?: PlainCube;
}) {
  const {graph, setGraph, map, input} = useSideBar();
  const {translate: t} = useTranslation();
  useBuildGraph(items, locale, graph, setGraph);
  const actions = useActions();

  const onSelectCube = (table: string, subtopic: string) => {
    const cube = items.find(
      item => item.name === table && getAnnotation(item, "subtopic", locale) === subtopic
    );
    if (cube) {
      actions.resetDrilldowns({});
      actions.resetCuts({});
      actions.resetMeasures({});

      return actions.willSetCube(cube.name);
    }
  };

  const topics = useMemo(() => getKeys(items as AnnotatedCube[], "topic", locale), [items, locale]);

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
    />
  ) : (
    graph.items.length > 0 && (
      <RootAccordions
        items={topics}
        graph={graph}
        onSelectCube={onSelectCube}
        selectedItem={selectedItem}
        locale={locale}
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

function RootAccordions({items, graph, locale, selectedItem, onSelectCube}) {
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
            borderLeftColor: t.colors[t.primaryColor][t.fn.primaryShade()],
            borderLeftStyle: "solid",
            color: t.colors[t.primaryColor][t.fn.primaryShade()]
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
      {items.map(item => {
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
  parent
}: {
  item: string;
  selectedItem?: PlainCube;
  onSelectCube: (table: string, subtopic: string) => void;
  graph: Graph;
  locale: string;
  parent?: string;
}) {
  const callback = useSelectCube(onSelectCube);
  const {classes} = useLinkStyles();

  const table = graph.getName(item, locale);
  const subtopic = parent ?? "";
  return (
    <Text
      key={`table-${item}`}
      fz="xs"
      pl={60}
      maw={"100%"}
      pr="md"
      component="a"
      className={
        isSelected(selectedItem, getCube(graph.items, item, subtopic, locale))
          ? `${classes.link} ${classes.linkActive}`
          : classes.link
      }
      sx={t => ({
        background: isSelected(selectedItem, getCube(graph.items, item, subtopic, locale))
          ? t.fn.primaryColor()
          : t.colorScheme === "dark"
          ? t.colors.dark[6]
          : t.colors.gray[3],
        overflow: "hidden"
      })}
      onClick={callback(item, subtopic)}
    >
      {table}
    </Text>
  );
}

type NestedAccordionType = {
  items: string[];
  graph: any;
  parent?: string;
  selectedItem?: PlainCube;
  onSelectCube: (name: string) => void;
  locale: string;
};

function SubtopicAccordion({
  items,
  graph,
  parent,
  onSelectCube,
  selectedItem,
  locale
}: PropsWithChildren<NestedAccordionType>) {
  const {value, setValue} = useAccordionValue("subtopic", locale);
  return (
    <Accordion
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
          borderLeft: 8,
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
      {[...items].map((item, index) => {
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
                />
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
