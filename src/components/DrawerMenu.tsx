import React, {useLayoutEffect, useMemo, useState} from "react";
import {useDisclosure, useMediaQuery} from "@mantine/hooks";
import {
  Drawer,
  Button,
  Group,
  NumberInput,
  MultiSelect,
  ActionIcon,
  Menu,
  Text,
  Box,
  Flex,
  Checkbox,
  ThemeIcon,
  useMantineTheme
} from "@mantine/core";
import {useSelector} from "react-redux";
import {
  selectCutItems,
  selectDrilldownItems,
  selectDrilldownMap,
  selectFilterItems,
  selectFilterMap,
  selectLocale,
  selectMeasureMap
} from "../state/queries";
import {useTranslation} from "../hooks/translation";
import {selectOlapMeasureItems, selectOlapDimensionItems} from "../state/selectors";
import {useActions} from "../hooks/settings";
import {filterMap} from "../utils/array";
import {
  buildMeasure,
  CutItem,
  buildCut,
  buildDrilldown,
  buildFilter,
  MeasureItem,
  FilterItem
} from "../utils/structs";
import {isActiveItem} from "../utils/validation";
import {
  IconFilter,
  IconFilterOff,
  IconMathGreater,
  IconMathLower,
  IconStack3,
  IconSettings,
  IconArrowsLeftRight,
  IconPlus
} from "@tabler/icons-react";
import type {PlainLevel} from "@datawheel/olap-client";
import {getCaption} from "../utils/string";
import {abbreviateFullName} from "../utils/format";
import {stringifyName} from "../utils/transform";
import {Comparison} from "@datawheel/olap-client";
import {getFiltersConditions} from "./TableView";
import {BarsSVG, StackSVG} from "./icons";

function AddColumnsDrawer() {
  const [opened, {open, close}] = useDisclosure(false);
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  return (
    <>
      <Drawer
        opened={opened}
        position="right"
        onClose={close}
        title={
          <Group>
            <IconPlus size="1.2rem" />
            <Text fw={700}>{t("params.add_columns")}</Text>
          </Group>
        }
        styles={t => ({
          inner: {
            position: "absolute",
            inset: 0
          },
          header: {
            background: "transparent"
          },
          content: {
            backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1]
          }
        })}
        overlayProps={{
          opacity: 0.1
        }}
        withinPortal={false}
      >
        <MeasuresOptions />
        <DrillDownOptions />
      </Drawer>
      <Group position="center" sx={{flexWrap: "nowrap"}}>
        {smallerThanMd ? (
          <ActionIcon onClick={open} size="md" variant="filled" color={theme.primaryColor}>
            <IconStack3 size="0.75rem" />
          </ActionIcon>
        ) : (
          <Button leftIcon={<IconPlus size="1.2rem" />} onClick={open} m="md" size="sm">
            {t("params.add_columns")}
          </Button>
        )}
      </Group>
    </>
  );
}

export function DrawerMenu() {
  return (
    <Drawer opened={true} position="right" onClose={close} title="Columns">
      <MeasuresOptions />
      <DrillDownOptions />
    </Drawer>
  );
}

function DrillDownOptions() {
  const locale = useSelector(selectLocale);
  const selectedDimensions = useSelector(selectDrilldownItems);
  const dimensions = useSelector(selectOlapDimensionItems) || [];

  const activeItems = selectedDimensions.filter(i => i.active);
  const activeCount = activeItems.length;

  const options = useMemo(
    () =>
      dimensions.map(dimension => (
        <DimensionItem
          dimension={dimension}
          locale={locale.code}
          key={dimension.uri}
          activeItems={activeItems}
          activeCount={activeCount} // Pass the active count
        />
      )),
    [dimensions, activeItems, activeCount]
  );

  return options;
}

function DimensionItem({dimension, locale, activeItems, activeCount}) {
  const isChildSubMenu = dimension.hierarchies.length !== 1;

  const options = dimension.hierarchies.map(hie => (
    <HierarchyItem
      dimension={dimension}
      hierarchy={hie}
      isSubMenu={isChildSubMenu}
      key={hie.uri}
      locale={locale}
      activeItems={activeItems}
      activeCount={activeCount}
    />
  ));

  if (!isChildSubMenu) {
    return options[0];
  }

  return options;
}

function HierarchyItem({dimension, hierarchy, isSubMenu, locale, activeItems, activeCount}) {
  const {translate: t} = useTranslation();

  const label = useMemo(() => {
    const captions = [getCaption(dimension, locale), getCaption(hierarchy, locale)];
    if (isSubMenu) {
      return captions[1];
    }
    return t("params.dimmenu_hierarchy", {
      abbr: abbreviateFullName(captions, t("params.dimmenu_abbrjoint")),
      dimension: captions[0],
      hierarchy: captions[1]
    });
  }, [locale, dimension, hierarchy, isSubMenu]);

  const isChildSubMenu = hierarchy.levels.length !== 1;

  const options = hierarchy.levels.map(lvl => (
    <LevelItem
      dimension={dimension}
      hierarchy={hierarchy}
      isSubMenu={isChildSubMenu}
      key={lvl.uri}
      level={lvl}
      locale={locale}
      activeItems={activeItems}
      activeCount={activeCount}
    />
  ));

  if (!isChildSubMenu) {
    return options[0];
  }

  return options;
}

function LevelItem({dimension, hierarchy, isSubMenu, level, locale, activeItems, activeCount}) {
  const [activeFilter, setActiveFilter] = useState(false);
  const {translate: t} = useTranslation();
  const actions = useActions();
  const cutItems = useSelector(selectCutItems);
  const drilldowns = useSelector(selectDrilldownMap);
  const ditems = useSelector(selectDrilldownItems);
  const dimensions = useSelector(selectOlapDimensionItems);

  const label = useMemo(() => {
    const captions = [
      getCaption(dimension, locale),
      getCaption(hierarchy, locale),
      getCaption(level, locale)
    ];
    if (isSubMenu) {
      return captions[2];
    }
    return t("params.dimmenu_level", {
      abbr: abbreviateFullName(captions, t("params.dimmenu_abbrjoint")),
      dimension: captions[0],
      hierarchy: captions[1],
      level: captions[2]
    });
  }, [locale, dimension, hierarchy, level, isSubMenu]);

  const createCutHandler = React.useCallback((level: PlainLevel) => {
    const cutItem = buildCut({...level, members: [], key: level.fullName});
    cutItem.active = false;
    actions.updateCut(cutItem);
  }, []);

  function createDrilldown(level: PlainLevel, cuts: CutItem[]) {
    const drilldown = buildDrilldown({...level, key: stringifyName(level), active: false});
    actions.updateDrilldown(drilldown);

    const cut = cuts.find(cut => cut.uniqueName === drilldown.uniqueName);
    if (!cut) {
      createCutHandler({...level, key: stringifyName(level)});
    }
    actions.willFetchMembers({...level, level: level.name}).then(members => {
      const dimension = dimensions.find(dim => dim.name === level.dimension);
      if (!dimension) return;
      actions.updateDrilldown({
        ...drilldown,
        dimType: dimension.dimensionType,
        memberCount: members.length,
        members
      });
    });

    return drilldown;
  }

  const currentDrilldown = drilldowns[stringifyName(level)];

  // Check if another hierarchy from the same dimension is already selected
  const isOtherHierarchySelected = activeItems.some(
    activeItem => activeItem.dimension === dimension.name && activeItem.hierarchy !== hierarchy.name
  );

  useLayoutEffect(() => {
    if (
      !drilldowns[stringifyName(level)] &&
      !ditems.find(d => d.uniqueName === buildDrilldown(level).uniqueName)
    ) {
      createDrilldown(level, cutItems);
    }
  }, [level, ditems]);

  const cut = cutItems.find(cut => {
    return cut.uniqueName === currentDrilldown?.uniqueName;
  });

  const updatecutHandler = React.useCallback((item: CutItem, members: string[]) => {
    actions.updateCut({...item, members});
  }, []);

  const checked = activeItems.map(stringifyName).includes(stringifyName(level));
  const disableUncheck = activeCount === 1 && checked;

  // If another hierarchy in the same dimension is selected, this level is disabled
  const isDisabled = isOtherHierarchySelected && !checked;

  if (!currentDrilldown) return;
  return (
    currentDrilldown && (
      <>
        <Group mt="sm" position="apart" key={level.uri} noWrap>
          <Checkbox
            onChange={() => {
              if (cut) {
                const active = checked ? false : cut.members.length ? true : false;
                actions.updateCut({...cut, active});
              }
              actions.updateDrilldown({...currentDrilldown, active: !currentDrilldown.active});
            }}
            checked={checked}
            label={label}
            size="xs"
            disabled={isDisabled || disableUncheck}
          />
          <Group sx={{flexWrap: "nowrap"}}>
            <ActionIcon
              size="sm"
              onClick={() => setActiveFilter(value => !value)}
              disabled={isDisabled}
            >
              {activeFilter ? <IconFilterOff /> : <IconFilter />}
            </ActionIcon>

            <ThemeIcon size="xs" color="gray" variant="light" bg="transparent">
              <StackSVG />
            </ThemeIcon>
          </Group>
        </Group>
        {activeFilter && (
          <Box pt="md">
            <MultiSelect
              sx={{flex: "1 1 100%"}}
              searchable
              onChange={value => {
                if (cut) {
                  if (currentDrilldown.active && !cut.active) {
                    updatecutHandler({...cut, active: true}, value);
                  } else {
                    updatecutHandler(cut, value);
                  }
                }
              }}
              placeholder={`Filter by ${label}`}
              value={cut?.members || []}
              data={currentDrilldown.members.map(m => ({
                value: String(m.key),
                label: m.caption ? `${m.caption} ${m.key}` : m.name
              }))}
              clearable
              nothingFound="Nothing found"
              disabled={isDisabled} // Disable filter selection if disabled
            />
          </Box>
        )}
      </>
    )
  );
}

export function getFilterfnKey(type) {
  switch (type) {
    case "greaterThan":
      return "GT";
    case "lessThan":
      return "LT";
    case "between":
      return "BT";
    default:
      return "Not Found";
  }
}

export function getFilterFn(filter: FilterItem) {
  if (filter.conditionOne && filter.conditionTwo) {
    if (filter.conditionOne[0] === Comparison.GTE && filter.conditionTwo[0] === Comparison.LTE) {
      return "between";
    }
  }
  if (filter.conditionOne[0] === Comparison.GTE || filter.conditionOne[0] === Comparison.GT) {
    return "greaterThan";
  }
  if (filter.conditionOne[0] === Comparison.LTE) {
    return "lessThan";
  }
}

export function getFilterValue(filter: FilterItem) {
  const filterFn = getFilterFn(filter);
  const isBetween = filterFn === "between";
  if (isBetween && filter.conditionTwo) {
    return [filter.conditionOne[2], filter.conditionTwo[2]];
  }
  return filter.conditionOne[2];
}

function isNotValid(value) {
  return value === null || value === undefined || Number.isNaN(value);
}

export function NumberInputComponent({text, filter}: {text: string; filter: FilterItem}) {
  const actions = useActions();

  function getFilterValue(filter: FilterItem) {
    return isNotValid(filter.conditionOne[2]) || filter.conditionOne[2] === 0
      ? ""
      : filter.conditionOne[2];
  }

  function onInputChange({filter, value}: {filter: FilterItem; value: number | ""}) {
    const isEmpty = value === "";
    const conditions =
      getFiltersConditions(getFilterFn(filter) || "greaterThan", [Number(value)]) || {};
    const active = isEmpty ? false : true;
    actions.updateFilter(buildFilter({...filter, active, ...conditions}));
  }

  return (
    <NumberInput
      description={text}
      placeholder={text}
      value={getFilterValue(filter)}
      onChange={value => onInputChange({filter, value})}
      sx={{flex: "1 1 auto"}}
      size="xs"
    />
  );
}

export function MinMax({filter, ...rest}: {filter: FilterItem}) {
  const actions = useActions();

  function onInputChangeMinMax(props: {filter: FilterItem; min: number | ""; max: number | ""}) {
    const {filter, min, max} = props;
    const conditions =
      getFiltersConditions(getFilterFn(filter) || "greaterThan", [Number(min), Number(max)]) || {};
    const active = Boolean(min) && Boolean(max);

    actions.updateFilter(buildFilter({...filter, active, ...conditions}));
  }

  function getFilterValue(condition?: [`${Comparison}`, string, number]) {
    if (condition) {
      return isNotValid(condition[2]) || condition[2] === 0 ? "" : condition[2];
    }
    return "";
  }

  const min = getFilterValue(filter.conditionOne);
  const max = getFilterValue(filter.conditionTwo);
  return (
    <Flex gap="xs">
      <NumberInput
        placeholder={"Min"}
        description={"Min"}
        value={min}
        onChange={value => onInputChangeMinMax({filter, min: value, max})}
        {...rest}
      />
      <NumberInput
        placeholder={"Max"}
        description={"Max"}
        value={max}
        onChange={value => onInputChangeMinMax({filter, min, max: value})}
        {...rest}
      />
    </Flex>
  );
}

export function FilterFnsMenu({filter}: {filter: FilterItem}) {
  const actions = useActions();
  const {translate: t} = useTranslation();
  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon size="xs">
            <IconSettings />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{t("params.filter_mode")}</Menu.Label>
          <Menu.Item
            icon={<IconMathGreater size={14} />}
            onClick={() => {
              const conditions = getFiltersConditions("greaterThan", [0]) || {};
              actions.updateFilter(buildFilter({...filter, ...conditions, active: false}));
            }}
          >
            {t("comparison.GT")}
          </Menu.Item>
          <Menu.Item
            icon={<IconMathLower size={14} />}
            onClick={() => {
              const conditions = getFiltersConditions("lessThan", [0]) || {};
              actions.updateFilter(buildFilter({...filter, ...conditions, active: false}));
            }}
          >
            {t("comparison.LT")}
          </Menu.Item>
          <Menu.Item
            icon={<IconArrowsLeftRight size={14} />}
            onClick={() => {
              const conditions = getFiltersConditions("between", [0, 0]) || {};
              actions.updateFilter(buildFilter({...filter, ...conditions, active: false}));
            }}
          >
            {t("comparison.BT")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}

function MeasuresOptions() {
  // param measures
  const {code: locale} = useSelector(selectLocale);
  const {translate: t} = useTranslation();
  const itemMap = useSelector(selectMeasureMap);
  const filtersMap = useSelector(selectFilterMap);
  const filtersItems = useSelector(selectFilterItems);
  // server
  const measures = useSelector(selectOlapMeasureItems);
  //actions
  const actions = useActions();

  function handlerCreateMeasure(data: MeasureItem) {
    const measure = buildMeasure(data);
    actions.updateMeasure(measure);
    return measure;
  }
  function handlerCreateFilter(data: FilterItem) {
    const filter = buildFilter(data);
    actions.updateFilter(filter);
    return filter;
  }

  const filteredItems = useMemo(() => {
    return filterMap(measures, (m: MeasureItem) => {
      const measure = itemMap[m.name] || handlerCreateMeasure({...m, active: false});
      const foundFilter = filtersMap[m.name] || filtersItems.find(f => f.measure === measure.name);
      const filter =
        foundFilter ||
        handlerCreateFilter({
          measure: measure.name,
          active: false,
          key: measure.name
        } as FilterItem);
      return {measure, filter};
    });
  }, [itemMap, measures, filtersMap, filtersItems]);

  const activeItems = filteredItems.filter(f => isActiveItem(f.measure));

  const options = filteredItems.map(({measure, filter}) => {
    return (
      <FilterItem key={measure.key} measure={measure} filter={filter} activeItems={activeItems} />
    );
  });

  return options;
}

function FilterItem({
  measure,
  filter,
  activeItems
}: {
  measure: MeasureItem;
  filter: FilterItem;
  activeItems: {
    measure: MeasureItem;
    filter: FilterItem;
  }[];
}) {
  const [activeFilter, setActiveFilter] = useState(false);
  const {translate: t} = useTranslation();
  const filterFn = getFilterFn(filter);
  const text = t(`comparison.${getFilterfnKey(filterFn)}`);
  const isBetween = filterFn === "between";
  const checked = activeItems.map(active => active.measure.name).includes(measure.name);
  const actions = useActions();

  const isLastSelected = activeItems.length === 1 && checked;

  return (
    <Box key={measure.name}>
      <Group mt="sm" position="apart">
        <Checkbox
          onChange={() => {
            // Only toggle the measure if it's not the last one selected
            if (!isLastSelected) {
              actions.updateMeasure({...measure, active: !measure.active});
              actions.updateFilter({...filter, active: checked ? false : true});
            }
          }}
          checked={checked}
          label={measure.name}
          size="xs"
          disabled={isLastSelected} // Disable checkbox if it's the last one selected
        />
        <Group sx={{flexWrap: "nowrap"}}>
          {activeFilter && <FilterFnsMenu filter={filter} />}
          <ActionIcon size="xs" onClick={() => setActiveFilter(value => !value)}>
            {activeFilter ? <IconFilterOff /> : <IconFilter />}
          </ActionIcon>
          <ThemeIcon size="xs" color="gray" variant="light" bg="transparent">
            <BarsSVG />
          </ThemeIcon>
        </Group>
      </Group>
      {activeFilter && (
        <Box pt="md">
          {isBetween ? (
            <MinMax filter={filter} />
          ) : (
            <NumberInputComponent text={text} filter={filter} />
          )}
        </Box>
      )}
    </Box>
  );
}

export default AddColumnsDrawer;
