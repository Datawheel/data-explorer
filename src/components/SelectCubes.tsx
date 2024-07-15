import {type PlainCube} from "@datawheel/olap-client";
import {Anchor, Stack, Text, TextProps, Box, Accordion, AccordionControlProps} from "@mantine/core";
import React, {PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectLocale, selectMeasureMap, selectValidQueryStatus} from "../state/queries";
import {selectOlapCube, selectOlapDimensionItems} from "../state/selectors";
import {selectOlapCubeItems} from "../state/server";
import {selectDrilldownItems, selectCubeName} from "../state/queries";
import {getAnnotation} from "../utils/string";
import {buildDrilldown} from "../utils/structs";
import type {Annotated} from "../utils/types";
import type {PlainLevel} from "@datawheel/olap-client";
import {useSideBar} from "./SideBar";
import Graph from "../utils/graph";
import Results, {useStyles as useLinkStyles} from "./Results";

export function SelectCube() {
  const items = useSelector(selectOlapCubeItems);
  const selectedItem = useSelector(selectOlapCube);

  if (items.length === 1) {
    return null;
  }

  return <SelectCubeInternal items={items} selectedItem={selectedItem} />;
}

/** */
function SelectCubeInternal(props: {items: PlainCube[]; selectedItem: PlainCube | undefined}) {
  const {items, selectedItem} = props;
  const {translate: t} = useTranslation();
  const {code: locale} = useSelector(selectLocale);
  const {willRequestQuery, updateMeasure, updateDrilldown, willFetchMembers} = useActions();
  const initRef = useRef(false);

  const cube = useSelector(selectCubeName);
  const itemMap = useSelector(selectMeasureMap);
  const dimensions = useSelector(selectOlapDimensionItems);

  const addDrilldown = useCallback(
    (level: PlainLevel) => {
      const drilldownItem = buildDrilldown({...level, key: level.fullName});
      updateDrilldown(drilldownItem);
      return willFetchMembers({...level, level: level.name}).then(members => {
        const dimension = dimensions.find(dim => dim.name === level.dimension);
        if (!dimension) return;
        return updateDrilldown({
          ...drilldownItem,
          dimType: dimension.dimensionType,
          memberCount: members.length,
          members
        });
      });
    },
    [dimensions]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cubeParam = params.get("cube");

    //autoload if not params
    if (selectedItem && cube && !cubeParam) {
      initRef.current = true;
      const measure = Object.keys(itemMap)
        .map(k => itemMap[k])
        .shift();
      const dimension = [...dimensions].shift();
      if (measure && dimension) {
        updateMeasure({...measure, active: true});
        addDrilldown(dimension.hierarchies[0].levels[0]).then(() => {
          willRequestQuery();
        });
      }
    }
    if (selectedItem && cube && cubeParam) {
      if (!initRef.current) {
        initRef.current = true;
      } else {
        const measure = Object.keys(itemMap)
          .map(k => itemMap[k])
          .shift();
        const dimension = [...dimensions].shift();
        if (measure && dimension) {
          updateMeasure({...measure, active: true});
          addDrilldown(dimension.hierarchies[0].levels[0]).then(() => {
            willRequestQuery();
          });
        }
      }
    }
  }, [selectedItem, cube]);

  return (
    <Stack id="select-cube" spacing={"xs"} w={300}>
      <CubeTree items={items as AnnotatedCube[]} locale={locale} selectedItem={selectedItem} />
      {selectedItem && (
        <Text mt="sm" sx={{"& p": {margin: 0}}}>
          <CubeAnnotation
            annotation="description"
            className="dex-cube-description"
            item={selectedItem}
            locale={locale}
          />
          <CubeSourceAnchor item={selectedItem} locale={locale} fz="xs" />
          <CubeAnnotation
            annotation="source_description"
            className="dex-cube-srcdescription"
            fz="xs"
            item={selectedItem}
            locale={locale}
          />
        </Text>
      )}
    </Stack>
  );
}

// check accordion
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
    item =>
      getAnnotation(item, "table", locale) === table &&
      getAnnotation(item, "subtopic", locale) === subtopic
  );
  return cube;
}

function useBuildGraph(items, locale) {
  const [graph, setGraph] = useState<Graph>(new Graph());

  useEffect(() => {
    const graph = new Graph();
    items.map(item => {
      const topic = getAnnotation(item, "topic", locale);
      const subtopic = getAnnotation(item, "subtopic", locale);
      const table = getAnnotation(item, "table", locale);
      graph.addNode(topic);
      graph.addNode(subtopic);
      graph.addNode(table);
      graph.addEdge(topic, subtopic);
      graph.addEdge(subtopic, table);

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
  const {graph, setGraph, map} = useSideBar();
  const {graph: graphInit} = useBuildGraph(items, locale);
  const actions = useActions();

  useEffect(() => {
    graphInit && setGraph(graphInit);
  }, [graphInit, setGraph, locale]);

  const onSelectCube = (table: string, subtopic: string) => {
    const cube = items.find(
      item =>
        getAnnotation(item, "table", locale) === table &&
        getAnnotation(item, "subtopic", locale) === subtopic
    );
    if (cube) {
      actions.willSetCube(cube.name);
    }
  };

  const topics = useMemo(() => getKeys(items as AnnotatedCube[], "topic", locale), [items, locale]);

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
  console.log(items, "items");
  const {value, setValue} = useAccordionValue("topic", locale);
  return (
    <Accordion
      value={value}
      onChange={setValue}
      key={"topic"}
      chevronPosition="left"
      w={300}
      styles={t => ({
        control: {
          "&[data-active]": {
            borderLeft: 5,
            borderLeftColor: t.colors.blue[4],
            borderLeftStyle: "solid"
          }
        },
        content: {
          paddingLeft: 0
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
  const {setExpanded} = useSideBar();
  const {classes} = useLinkStyles();
  const table = item;
  const subtopic = parent ?? "";
  return (
    <Text
      key={`table-${item}`}
      fz="sm"
      component="a"
      className={
        isSelected(selectedItem, getCube(graph.items, table, subtopic, locale))
          ? `${classes.link} ${classes.linkActive}`
          : classes.link
      }
      onClick={() => {
        onSelectCube(item, subtopic);
        setExpanded(false);
      }}
    >
      {item}
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
  console.log(items, "Sub");
  const {value, setValue} = useAccordionValue("subtopic", locale);
  return (
    <Accordion
      value={value}
      onChange={setValue}
      key={`subtopic-${parent}`}
      chevronPosition="left"
      w={300}
      styles={t => ({
        control: {
          "&[data-active]": {
            borderLeft: 5,
            borderLeftColor: t.colors.blue[4],
            borderLeftStyle: "solid"
          }
        },
        content: {
          paddingLeft: 0,
          paddingRight: 0
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

function CubeAnnotation(
  props: TextProps & {
    annotation: string;
    item: Annotated;
    locale: string;
  }
) {
  const {annotation, item, locale, ...textProps} = props;
  const content = getAnnotation(item, annotation, locale);
  return content ? (
    <Text component="p" {...textProps}>
      {content}
    </Text>
  ) : null;
}

/** */
function CubeSourceAnchor(
  props: TextProps & {
    item: Annotated;
    locale: string;
  }
) {
  const {item, locale, ...textProps} = props;
  const {translate: t} = useTranslation();

  const srcName = getAnnotation(item, "source_name", locale);
  const srcLink = getAnnotation(item, "source_link", locale);

  if (!srcName) return null;

  return (
    <Text component="p" {...textProps}>
      {`${t("params.label_source")}: `}
      {srcLink ? <Anchor href={srcLink}>{srcName}</Anchor> : <Text span>{srcName}</Text>}
    </Text>
  );
}
