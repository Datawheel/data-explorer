import { type PlainCube } from "@datawheel/olap-client";

import {
  Anchor,
  Stack,
  Text,
  TextProps,
  Box,
  Accordion,
  Button,
  AccordionControlProps,
  rem
} from "@mantine/core";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useActions } from "../hooks/settings";
import { useTranslation } from "../hooks/translation";
import { selectLocale, selectMeasureMap, selectValidQueryStatus } from "../state/queries";
import {
  selectOlapCube,
  selectOlapMeasureItems,
  selectOlapMeasureMap,
  selectOlapDimensionItems
} from "../state/selectors";
import { selectOlapCubeItems } from "../state/server";
import { selectDrilldownItems } from "../state/queries";
import { getAnnotation } from "../utils/string";
import { buildDrilldown } from "../utils/structs";
import Graph from "../utils/graph";
import type { Annotated } from "../utils/types";
import type { PlainLevel } from "@datawheel/olap-client";


const graph = new Graph();

export function SelectCube() {
  const items = useSelector(selectOlapCubeItems);
  const selectedItem = useSelector(selectOlapCube);

  if (items.length === 1) {
    return null;
  }

  return <SelectCubeInternal items={items} selectedItem={selectedItem} />;
}

/** */
function SelectCubeInternal(props: { items: PlainCube[]; selectedItem: PlainCube | undefined }) {
  const { items, selectedItem } = props;
  const { translate: t } = useTranslation();
  const { code: locale } = useSelector(selectLocale);
  const { willRequestQuery, updateMeasure, updateDrilldown, willFetchMembers } =
    useActions();

  const itemMap = useSelector(selectMeasureMap);
  const drilldowns = useSelector(selectDrilldownItems);
  const dimensions = useSelector(selectOlapDimensionItems);
  const { isValid, error } = useSelector(selectValidQueryStatus);

  const addDrilldown = useCallback(
    (level: PlainLevel) => {
      const drilldownItem = buildDrilldown(level);
      updateDrilldown(drilldownItem);
      return willFetchMembers({ ...level, level: level.name }).then(members => {
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
    // params.cube
    // check TS
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop: "string") => searchParams.get(prop),
    });
    if (selectedItem && !params.cube) {
      // if they are already in the url dont call it again.
      const measure = Object.keys(itemMap)
        .map(k => itemMap[k])
        .shift();
      const dimension = [...dimensions].shift();
      if (measure && dimension) {
        updateMeasure({ ...measure, active: true });
        addDrilldown(dimension.hierarchies[0].levels[0]);
        willRequestQuery();
      }
    }
  }, [selectedItem]);

  // check for double requests.
  // check difference with will execute query
  useEffect(() => {
    // willRequestQuery();
  }, [drilldowns, itemMap])

  return (
    <Stack id="select-cube" spacing={"lg"} w={400}>
      <CubeTree items={items as AnnotatedCube[]} locale={locale} selectedItem={selectedItem} />
      {selectedItem && (
        <Text mt="sm" sx={{ "& p": { margin: 0 } }}>
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

function AccordionControl(props: AccordionControlProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Accordion.Control {...props} />
    </Box>
  );
}

type Keys = "subtopic" | "topic" | "table";
type AnnotatedCube = PlainCube & { annotations: { subtopic: string; topic: string; table: string } }[];

function getKeys(
  items: AnnotatedCube[],
  k: Keys,
  locale: string,
  filter?: { key: Keys; value: string }
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

function getCube(items: AnnotatedCube[], name: string) {
  const cube = items.find(i => i.annotations.table === name);
  return cube;
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
  const actions = useActions();

  const onSelectCube = (name: string) => {
    const cube = items.find(i => i.annotations.table === name);
    if (cube) {
      actions.willSetCube(cube.name);
    }
  };

  const topics = useMemo(() => {
    items.map(item => {
      const {
        annotations: { topic, subtopic, table }
      } = item;
      graph.addNode(topic);
      graph.addNode(subtopic);
      graph.addNode(table);
      graph.addEdge(topic, subtopic);
      graph.addEdge(subtopic, table);
      return item;
    });
    const topics = getKeys(items as AnnotatedCube[], "topic", locale);
    graph.items = items;

    return topics;
  }, [items]);

  return (
    <NestedAccordion
      items={topics}
      graph={graph}
      onSelectCube={onSelectCube}
      selectedItem={selectedItem}
    />
  );
}

function CubeButton({
  item,
  onSelectCube,
  selectedItem
}: {
  item: string;
  selectedItem?: PlainCube;
  onSelectCube: (name: string) => void;
}) {
  return (
    <Button
      fullWidth
      mt="md"
      radius="md"
      onClick={() => onSelectCube(item)}
      styles={theme => ({
        root: {
          backgroundColor: isSelected(selectedItem, getCube(graph.items, item))
            ? theme.colors.blue[4]
            : theme.colors.gray[4],
          border: 0,
          height: rem(42),
          paddingLeft: rem(20),
          paddingRight: rem(20),
          "&:not([data-disabled])": theme.fn.hover({
            backgroundColor: theme.fn.darken(theme.colors.blue[4], 0.05)
          })
        }
      })}
    >
      {item}
    </Button>
  );
}

type NestedAccordionType = {
  items: string[];
  graph: any;
  parent?: string;
  selectedItem?: PlainCube;
  onSelectCube: (name: string) => void;
};

function NestedAccordion({
  items,
  graph,
  parent,
  onSelectCube,
  selectedItem
}: PropsWithChildren<NestedAccordionType>) {
  return [...items].map(item => {
    const filtered = [...graph.adjList[item]].filter(topic => topic !== parent);
    let component: React.ReactNode;
    if (filtered.length === 0) {
      return (
        <CubeButton
          item={item}
          onSelectCube={onSelectCube}
          key={item}
          selectedItem={selectedItem}
        />
      );
    } else if (filtered.length === 1) {
      const topic = filtered[0];
      component = (
        <CubeButton
          item={topic}
          onSelectCube={onSelectCube}
          key={item}
          selectedItem={selectedItem}
        />
      );
    } else {
      component = (
        <NestedAccordion
          items={filtered}
          graph={graph}
          parent={item}
          selectedItem={selectedItem}
          onSelectCube={onSelectCube}
          key={item}
        />
      );
    }
    return (
      <Accordion
        key={`parent-${item}`}
        chevronPosition="left"
        w={400}
        styles={t => ({
          control: {
            "&[data-active]": {
              borderLeft: 5,
              borderLeftColor: t.colors.blue[4],
              borderLeftStyle: "solid"
            }
          }
        })}
      >
        <Accordion.Item value={`item-${item}`} key={`item-${item}`}>
          <AccordionControl>{item}</AccordionControl>
          <Accordion.Panel>{component}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    );
  });
}

/** */
function CubeAnnotation(
  props: TextProps & {
    annotation: string;
    item: Annotated;
    locale: string;
  }
) {
  const { annotation, item, locale, ...textProps } = props;
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
  const { item, locale, ...textProps } = props;
  const { translate: t } = useTranslation();

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
