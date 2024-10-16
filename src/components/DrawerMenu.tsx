import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  Group,
  Menu,
  MultiSelect,
  NumberInput,
  Text,
  ThemeIcon,
  useMantineTheme,
  MantineTheme,
  Tooltip
} from "@mantine/core";
import {useDisclosure, useMediaQuery} from "@mantine/hooks";
import {
  IconAdjustments,
  IconArrowsLeftRight,
  IconBox,
  IconClock,
  IconFilter,
  IconFilterOff,
  IconMathGreater,
  IconMathLower,
  IconPlus,
  IconSettings,
  IconStack3,
  IconWorld
} from "@tabler/icons-react";
import React, {PropsWithChildren, useCallback, useLayoutEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {Comparison} from "../api";
import type {TesseractDimension, TesseractHierarchy, TesseractLevel} from "../api/tesseract/schema";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {
  selectCutItems,
  selectDrilldownItems,
  selectDrilldownMap,
  selectFilterItems,
  selectFilterMap,
  selectLocale,
  selectMeasureMap
} from "../state/queries";
import {
  selectLevelTriadMap,
  selectOlapDimensionItems,
  selectOlapMeasureItems
} from "../state/selectors";
import {filterMap} from "../utils/array";
import {abbreviateFullName} from "../utils/format";
import {getCaption} from "../utils/string";
import {
  type CutItem,
  type DrilldownItem,
  FilterItem,
  type MeasureItem,
  buildCut,
  buildDrilldown,
  buildFilter,
  buildMeasure,
  buildProperty
} from "../utils/structs";
import {isActiveItem} from "../utils/validation";
import {getFiltersConditions} from "./TableView";
import {BarsSVG, StackSVG} from "./icons";
import {keyBy} from "../utils/transform";

const styles = (t: MantineTheme) => ({
  header: {
    background: "transparent"
  },
  content: {
    backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1]
  }
});

function AddColumnsDrawer() {
  const [opened, {open, close}] = useDisclosure(false);
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  return (
    <>
      <Drawer
        id="dex-column-drawer"
        opened={opened}
        position="right"
        onClose={close}
        closeButtonProps={{
          id: "dex-column-drawer-close"
        }}
        title={
          <Group>
            <IconPlus size="1.2rem" />
            <Text fw={700}>{t("params.add_columns")}</Text>
          </Group>
        }
        styles={styles}
        overlayProps={{
          opacity: 0.1
        }}
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
          <Button
            id="dex-column-btn"
            leftIcon={<IconPlus size="1.2rem" />}
            onClick={open}
            m="md"
            size="sm"
          >
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

  const options = useMemo(
    () =>
      dimensions.map(dimension => (
        <DimensionItem
          dimension={dimension}
          locale={locale.code}
          key={dimension.name}
          activeItems={activeItems}
        />
      )),
    [dimensions, activeItems, locale.code]
  );

  return options;
}

function DimensionItem({
  dimension,
  locale,
  activeItems
}: {
  dimension: TesseractDimension;
  locale: string;
  activeItems: DrilldownItem[];
}) {
  const isChildSubMenu = dimension.hierarchies.length !== 1;

  const options = dimension.hierarchies.map(hie => (
    <HierarchyItem
      dimension={dimension}
      hierarchy={hie}
      isSubMenu={isChildSubMenu}
      key={hie.name}
      locale={locale}
      activeItems={activeItems}
    />
  ));
  // if (!isChildSubMenu) {
  //   return options[0];
  // }
  return (
    <div
      key={dimension.name}
      className="dex-dimension-control"
      id={`dex-dimension-${dimension.name}`}
    >
      <Divider
        my="md"
        label={
          <Group>
            {getIconForDimensionType(dimension.type)}
            <Text italic>{getCaption(dimension, locale)}</Text>
          </Group>
        }
      />
      {options}
    </div>
  );
}

function HierarchyItem({
  dimension,
  hierarchy,
  isSubMenu,
  locale,
  activeItems
}: {
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  isSubMenu: boolean;
  locale: string;
  activeItems: DrilldownItem[];
}) {
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
  }, [locale, dimension, hierarchy, isSubMenu, t]);

  const isChildSubMenu = hierarchy.levels.length !== 1;

  const options = hierarchy.levels.map((lvl, index) => (
    <LevelItem
      dimension={dimension}
      hierarchy={hierarchy}
      isSubMenu={isChildSubMenu}
      key={lvl.name}
      level={lvl}
      locale={locale}
      activeItems={activeItems}
      depth={index}
    />
  ));

  if (!isChildSubMenu) {
    return options[0];
  }

  return options;
}

function LevelItem({
  dimension,
  hierarchy,
  isSubMenu,
  level,
  locale,
  activeItems,
  depth = 0
}: {
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  level: TesseractLevel;
  isSubMenu: boolean;
  locale: string;
  activeItems: DrilldownItem[];
  depth?: number;
}) {
  const [activeFilter, setActiveFilter] = useState(false);
  const [activePropertiesFilter, setActiveProperties] = useState(false);
  const {translate: t} = useTranslation();
  const actions = useActions();
  const cutItems = useSelector(selectCutItems);
  let drilldowns = useSelector(selectDrilldownMap);
  const ditems = useSelector(selectDrilldownItems);

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
  }, [locale, dimension, hierarchy, level, isSubMenu, t]);

  const createCutHandler = useCallback((level: TesseractLevel) => {
    const cutItem = buildCut({...level, members: [], active: false});
    actions.updateCut(cutItem);
  }, []);

  function createDrilldown(level: TesseractLevel, cuts: CutItem[]) {
    const drilldown = buildDrilldown({...level, key: level.name, active: false});
    actions.updateDrilldown(drilldown);

    const cut = cuts.find(cut => cut.level === drilldown.level);
    if (!cut) {
      createCutHandler(level);
    }
    actions.willFetchMembers(level.name).then(levelMeta => {
      actions.updateDrilldown({
        ...drilldown,
        members: levelMeta.members
      });
    });

    return drilldown;
  }
  const currentDrilldown = drilldowns[level.name];
  // Check if another hierarchy from the same dimension is already selected
  const isOtherHierarchySelected = activeItems.some(
    activeItem => activeItem.dimension === dimension.name && activeItem.hierarchy !== hierarchy.name
  );

  useLayoutEffect(() => {
    if (!drilldowns[level.name] && !ditems.find(d => d.level === level.name)) {
      createDrilldown(level, cutItems);
    }
  }, [level, ditems]);

  const cut = cutItems.find(cut => {
    return cut.level === currentDrilldown?.level;
  });

  const updatecutHandler = React.useCallback((item: CutItem, members: string[]) => {
    actions.updateCut({...item, members});
  }, []);

  const checked = activeItems.map(i => i.level).includes(level.name);
  const disableUncheck = activeItems.length === 1 && checked;

  // If another hierarchy in the same dimension is selected, this level is disabled
  const isDisabled = isOtherHierarchySelected && !checked;

  if (!currentDrilldown) return;

  const paddingLeft = `${5 * depth + 5}px`;

  const properities = currentDrilldown.properties.length ? currentDrilldown.properties : null;
  return (
    currentDrilldown && (
      <>
        <Group className="dex-level-control" mt="sm" position="apart" key={level.name} noWrap>
          <Checkbox
            sx={{cursor: "pointer", paddingLeft}}
            onChange={() => {
              if (cut) {
                const active = checked ? false : !!cut.members.length;
                actions.updateCut({...cut, active});
              }
              actions.updateDrilldown({
                ...currentDrilldown,
                active: !currentDrilldown.active
              });
            }}
            checked={checked}
            label={label}
            size="xs"
            disabled={isDisabled || disableUncheck}
          />
          <Group sx={{flexWrap: "nowrap"}}>
            <ActionIcon
              className="dex-level-filter"
              size="sm"
              onClick={() => setActiveFilter(value => !value)}
              disabled={isDisabled}
            >
              {activeFilter ? <IconFilterOff /> : <IconFilter />}
            </ActionIcon>
            {properities && (
              <Tooltip label={t("params.add_metadata")}>
                <ActionIcon onClick={() => setActiveProperties(value => !value)}>
                  <IconAdjustments />
                </ActionIcon>
              </Tooltip>
            )}
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
                label: m.caption ? `${m.caption} ${m.key}` : `${m.key}`
              }))}
              clearable
              nothingFound="Nothing found"
              disabled={isDisabled} // Disable filter selection if disabled
            />
          </Box>
        )}
        {activePropertiesFilter && <PropertiesMultiSelect item={currentDrilldown} />}
      </>
    )
  );
}

type PropertiesMultiSelectType = {
  item: DrilldownItem;
};
function PropertiesMultiSelect({item}: PropsWithChildren<PropertiesMultiSelectType>) {
  const levelTriadMap = useSelector(selectLevelTriadMap);
  const locale = useSelector(selectLocale);
  const actions = useActions();
  const {translate: t} = useTranslation();

  const propertiesUpdateHandler = useCallback(
    (activeProps: string[]) => {
      const properties = item.properties.map(prop =>
        buildProperty({
          ...prop,
          active: activeProps.includes(prop.key)
        })
      );
      actions.updateDrilldown({...item, properties});
    },
    [item]
  );

  const propertyRecords = useMemo(
    () => keyBy(item.properties, item => item.key),
    [item.properties]
  );

  const activeProperties = filterMap(item.properties, item =>
    isActiveItem(item) ? item.key : null
  );

  const label = useMemo(() => {
    const triad = levelTriadMap[`${item.level}`];
    const triadCaptions = triad.map(item => getCaption(item, locale.code));
    return t("params.tag_drilldowns", {
      abbr: abbreviateFullName(triadCaptions, t("params.tag_drilldowns_abbrjoint")),
      dimension: triadCaptions[0],
      hierarchy: triadCaptions[1],
      level: triadCaptions[2],
      propCount: activeProperties.length
    });
  }, [activeProperties.join("-"), item, locale.code]);

  return (
    <Box pt="md">
      <MultiSelect
        sx={{flex: "1 1 100%"}}
        searchable
        onChange={propertiesUpdateHandler}
        value={activeProperties || []}
        placeholder={`Filter by ${label}`}
        data={item.properties.map(property => ({
          value: String(property.key),
          label: property.name
        }))}
        clearable
        nothingFound="Nothing found"
      />
    </Box>
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
    const active = !isEmpty;
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
  const itemMap = useSelector(selectMeasureMap);
  const filtersMap = useSelector(selectFilterMap);
  const filtersItems = useSelector(selectFilterItems);
  // server
  const measures = useSelector(selectOlapMeasureItems);
  //actions
  const actions = useActions();

  const handlerCreateMeasure = useCallback((data: Partial<MeasureItem>) => {
    const measure = buildMeasure(data);
    actions.updateMeasure(measure);
    return measure;
  }, []);

  const handlerCreateFilter = useCallback((data: FilterItem) => {
    const filter = buildFilter(data);
    actions.updateFilter(filter);
    return filter;
  }, []);

  const measureCaptions = Object.values(measures)
    .map(m => `${m.caption}`)
    .join(",");
  const filteredItems = useMemo(() => {
    return filterMap(measures, m => {
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
  }, [
    itemMap,
    measures,
    filtersMap,
    filtersItems,
    handlerCreateFilter,
    handlerCreateMeasure,
    measureCaptions
  ]);

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
          sx={{cursor: "pointer"}}
          onChange={() => {
            // Only toggle the measure if it's not the last one selected
            if (!isLastSelected) {
              actions.updateMeasure({...measure, active: !measure.active});
              actions.updateFilter({...filter, active: !checked});
            }
          }}
          checked={checked}
          label={measure.caption}
          size="xs"
          disabled={isLastSelected} // Disable checkbox if it's the last one selected
        />
        <Group sx={{flexWrap: "nowrap"}}>
          {activeFilter && <FilterFnsMenu filter={filter} />}
          <ActionIcon size="sm" onClick={() => setActiveFilter(value => !value)}>
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

// Function to get the appropriate icon for each dimension type
const getIconForDimensionType = dimensionType => {
  switch (dimensionType) {
    case "geo":
      return <IconWorld size={20} />;
    case "time":
      return <IconClock size={20} />;
    // Add more cases for other dimension types
    default:
      return <IconBox size={20} />; // Default icon
  }
};

export default AddColumnsDrawer;
