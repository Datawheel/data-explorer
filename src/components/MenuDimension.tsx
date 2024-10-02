import {Group, Menu, Text, UnstyledButton} from "@mantine/core";
import {IconChevronRight, IconStack, IconStack2, IconStack3} from "@tabler/icons-react";
import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import {useTranslation} from "../hooks/translation";
import {selectLocale} from "../state/queries";
import {selectOlapDimensionItems} from "../state/selectors";
import {abbreviateFullName} from "../utils/format";
import {getCaption} from "../utils/string";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
} from "../api/tesseract/schema";

export function DimensionMenu(props: {
  isMediumScreen?: boolean;
  onItemSelect: (
    level: TesseractLevel,
    hierarchy: TesseractHierarchy,
    dimension: TesseractDimension,
  ) => void;
  selectedItems: string[];
}) {
  const dimensions = useSelector(selectOlapDimensionItems) || [];
  const locale = useSelector(selectLocale);

  const options = useMemo(
    () =>
      dimensions.map(dim => (
        <DimensionMenuItem
          dimension={dim}
          locale={locale.code}
          isMediumScreen={props.isMediumScreen}
          key={dim.name}
          onItemSelect={props.onItemSelect}
          selectedItems={props.selectedItems}
        />
      )),
    [
      locale.code,
      dimensions,
      props.isMediumScreen,
      props.selectedItems,
      props.onItemSelect,
    ],
  );

  return <Menu>{options}</Menu>;
}

export function DimensionMenuItem(props: {
  dimension: TesseractDimension;
  isMediumScreen?: boolean;
  locale: string;
  onItemSelect: (
    level: TesseractLevel,
    hierarchy: TesseractHierarchy,
    dimension: TesseractDimension,
  ) => void;
  selectedItems: string[];
}) {
  const {dimension, locale, isMediumScreen, onItemSelect, selectedItems} = props;

  const {translate: t} = useTranslation();

  const label = useMemo(
    () =>
      t("params.dimmenu_dimension", {
        dimension: getCaption(dimension, locale),
      }),
    [locale, t, dimension],
  );

  const isChildSubMenu = dimension.hierarchies.length !== 1;

  const options = dimension.hierarchies.map(hie => (
    <HierarchyMenuItem
      dimension={dimension}
      hierarchy={hie}
      isMediumScreen={isMediumScreen}
      isSubMenu={isChildSubMenu}
      key={hie.name}
      locale={locale}
      onItemSelect={onItemSelect}
      selectedItems={selectedItems}
    />
  ));

  if (!isChildSubMenu) {
    return options[0];
  }

  return (
    <Menu key={dimension.name} position="left" shadow="md" withArrow>
      <Menu.Target>
        <UnstyledButton component="span">
          <Menu.Item
            icon={<IconStack3 />}
            sx={theme => ({
              [theme.fn.smallerThan("md")]: {
                maxWidth: 200,
              },
            })}
          >
            <Group noWrap position="apart">
              <Text>{label}</Text>
              <IconChevronRight stroke={1.5} size={16} />
            </Group>
          </Menu.Item>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu>{options}</Menu>
      </Menu.Dropdown>
    </Menu>
  );
}

export function HierarchyMenuItem(props: {
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  isMediumScreen?: boolean;
  isSubMenu?: boolean;
  locale: string;
  onItemSelect: (
    level: TesseractLevel,
    hierarchy: TesseractHierarchy,
    dimension: TesseractDimension,
  ) => void;
  selectedItems: string[];
}) {
  const {dimension, hierarchy, locale, onItemSelect, selectedItems} = props;

  const {translate: t} = useTranslation();

  const label = useMemo(() => {
    const captions = [getCaption(dimension, locale), getCaption(hierarchy, locale)];
    if (props.isSubMenu) {
      return captions[1];
    }
    return t("params.dimmenu_hierarchy", {
      abbr: abbreviateFullName(captions, t("params.dimmenu_abbrjoint")),
      dimension: captions[0],
      hierarchy: captions[1],
    });
  }, [locale, t, dimension, hierarchy, props.isSubMenu]);

  const isChildSubMenu = hierarchy.levels.length !== 1;

  const options = hierarchy.levels.map(lvl => (
    <LevelMenuItem
      dimension={dimension}
      hierarchy={hierarchy}
      isSubMenu={isChildSubMenu}
      key={lvl.name}
      level={lvl}
      locale={locale}
      onItemSelect={onItemSelect}
      selectedItems={selectedItems}
    />
  ));

  if (!isChildSubMenu) {
    return options[0];
  }

  return (
    <Menu key={hierarchy.name} position={"left"} shadow="md" withArrow>
      <Menu.Target>
        <UnstyledButton component="span">
          <Menu.Item
            icon={<IconStack2 />}
            sx={theme => ({
              [theme.fn.smallerThan("md")]: {
                maxWidth: 200,
              },
            })}
          >
            <Group noWrap position="apart">
              <Text>{label}</Text>
              <IconChevronRight stroke={1.5} size={16} />
            </Group>
          </Menu.Item>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu>{options}</Menu>
      </Menu.Dropdown>
    </Menu>
  );
}

export function LevelMenuItem(props: {
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  isSubMenu?: boolean;
  level: TesseractLevel;
  locale: string;
  onItemSelect: (
    level: TesseractLevel,
    hierarchy: TesseractHierarchy,
    dimension: TesseractDimension,
  ) => void;
  selectedItems: string[];
}) {
  const {dimension, hierarchy, level, locale} = props;

  const {translate: t} = useTranslation();

  const label = useMemo(() => {
    const captions = [
      getCaption(dimension, locale),
      getCaption(hierarchy, locale),
      getCaption(level, locale),
    ];
    if (props.isSubMenu) {
      return captions[2];
    }
    return t("params.dimmenu_level", {
      abbr: abbreviateFullName(captions, t("params.dimmenu_abbrjoint")),
      dimension: captions[0],
      hierarchy: captions[1],
      level: captions[2],
    });
  }, [locale, t, dimension, hierarchy, level, props.isSubMenu]);

  return (
    <Menu.Item
      disabled={props.selectedItems.includes(level.name)}
      icon={<IconStack />}
      key={level.name}
      miw={200}
      onClick={() => props.onItemSelect(level, hierarchy, dimension)}
      sx={theme => ({
        [theme.fn.smallerThan("md")]: {
          maxWidth: 200,
        },
      })}
    >
      {label}
    </Menu.Item>
  );
}
