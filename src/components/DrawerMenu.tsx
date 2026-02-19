import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  Group,
  type MantineTheme,
  Menu,
  MultiSelect,
  NumberInput,
  Text,
  ThemeIcon,
  Tooltip,
  useMantineTheme
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
import {cloneDeep, debounce} from "lodash-es";
import React, {type PropsWithChildren, useCallback, useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {Comparison, DimensionType} from "../api";
import type {TesseractDimension, TesseractHierarchy, TesseractLevel} from "../api/tesseract/schema";
import {useidFormatters} from "../hooks/formatter";
import {useUpdateUrl} from "../hooks/permalink";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {useDimensionItems, useMeasureItems} from "../hooks/useQueryApi";
import {
  selectCutItems,
  selectDrilldownItems,
  selectDrilldownMap,
  selectFilterItems,
  selectFilterMap,
  selectLocale,
  selectMeasureMap
} from "../state/queries";
import {selectCurrentQueryItem} from "../state/queries";
import {selectLevelTriadMap} from "../state/selectors";
import {filterMap} from "../utils/array";
import {abbreviateFullName} from "../utils/format";
import {getCaption} from "../utils/string";
import {
  type CutItem,
  type DrilldownItem,
  FilterItem,
  type MeasureItem,
  type QueryItem,
  buildCut,
  buildFilter,
  buildMeasure,
  buildProperty,
  buildQuery
} from "../utils/structs";
import {isActiveItem} from "../utils/validation";
import {getFiltersConditions} from "./TableView";
import {BarsSVG, StackSVG} from "./icons";

const styles = (t: MantineTheme) => ({
  header: {
    background: "transparent"
  },
  content: {
    backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1]
  }
});

type AddColumnsDrawerProps = {
  children?: React.ReactNode;
};

const AddColumnsDrawer: React.FC<AddColumnsDrawerProps> = () => {
  const [opened, {open, close}] = useDisclosure(false);
  const updateUrl = useUpdateUrl();

  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanMd = useMediaQuery(
    `(max-width: ${theme.breakpoints.md}${
      /(?:px|em|rem|vh|vw|%)$/.test(theme.breakpoints.xs) ? "" : "px"
    })`
  );
  return (
    <>
      <Drawer
        id="dex-column-drawer"
        opened={opened}
        position="right"
        onClose={() => {
          updateUrl();
          close();
        }}
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
        <Box mt="3rem" pb="md">
          <Button
            fullWidth
            color="primary"
            onClick={() => {
              updateUrl();
              close();
            }}
          >
            {t("params.submit")}
          </Button>
        </Box>
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
            m="xs"
            size="xs"
          >
            {t("params.add_columns")}
          </Button>
        )}
      </Group>
    </>
  );
};

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
  const dimensions = useDimensionItems();

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
  const [activePropertiesFilter, setActiveProperties] = useState(false);
  const {translate: t} = useTranslation();

  const actions = useActions();

  const cutItems = useSelector(selectCutItems);
  const drilldowns = useSelector(selectDrilldownMap);
  const ditems = useSelector(selectDrilldownItems);
  const {idFormatters} = useidFormatters();

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

  const currentDrilldown = drilldowns[level.name];
  // Check if another hierarchy from the same dimension is already selected
  const isOtherHierarchySelected = activeItems.some(
    activeItem => activeItem.dimension === dimension.name && activeItem.hierarchy !== hierarchy.name
  );

  const isLastLevelInRequiredDimension =
    dimension.required &&
    activeItems.filter(item => item.dimension === dimension.name).length === 1;

  const cut = cutItems.find(cut => cut.level === level.name);

  const checked = activeItems.map(i => i.level).includes(level.name);
  const disableUncheck = activeItems.length === 1 && checked;

  // If another hierarchy in the same dimension is selected, this level is disabled
  const isDisabled = isLastLevelInRequiredDimension && checked;

  if (!currentDrilldown) return;

  const paddingLeft = `${5 * depth + 5}px`;

  const properties = currentDrilldown.properties.length ? currentDrilldown.properties : null;

  const dimensionIsTimeComplete = dimension.annotations.de_time_complete === "true";
  return (
    currentDrilldown && (
      <>
        <Group className="dex-level-control" mt="sm" position="apart" key={level.name} noWrap>
          <Checkbox
            sx={{cursor: "pointer", paddingLeft}}
            onChange={() => {
              if (isOtherHierarchySelected && !checked) {
                activeItems
                  .filter(
                    item => item.dimension === dimension.name && item.hierarchy !== hierarchy.name
                  )
                  .forEach(item => {
                    actions.updateDrilldown({...item, active: false});
                  });
              }
              actions.updateDrilldown({
                ...currentDrilldown,
                active: !currentDrilldown.active
              });
              if (cut && cut.members.length > 0) actions.updateCut({...cut, active: !cut.active});

              // if current dimension has time complete annotation
              if (dimensionIsTimeComplete) {
                const hierarchyLevels =
                  dimension.hierarchies.find(h => h.name === hierarchy.name)?.levels || [];

                // select all levels that are either active or match the current drilldown level to be added
                const availableLevels = hierarchyLevels.filter(
                  l =>
                    l.name &&
                    activeItems.some(item =>
                      !currentDrilldown.active
                        ? item.level === l.name || l.name === currentDrilldown.level
                        : item.level === l.name && item.level !== currentDrilldown.level
                    )
                );

                // take the higher order level
                const timeCompleteLevel = availableLevels.find(
                  l => l.depth === Math.min(...availableLevels.map(level => level.depth))
                );
                const deepestLevel = hierarchyLevels.find(
                  l => l.depth === Math.max(...hierarchyLevels.map(level => level.depth))
                );

                const deepestLevelAvailable = availableLevels.find(
                  l => l.depth === deepestLevel?.depth
                );

                if (
                  timeCompleteLevel &&
                  deepestLevel &&
                  timeCompleteLevel.depth < deepestLevel.depth &&
                  !deepestLevelAvailable
                ) {
                  actions.updateTimeComplete(timeCompleteLevel.name);
                } else {
                  actions.removeTimeComplete();
                }
              }
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
              onClick={() => {
                const nextCut = buildCut(cut || level);
                if (cut?.active) {
                  nextCut.active = false;
                  actions.updateCut(nextCut);
                } else {
                  actions.updateDrilldown({...currentDrilldown, active: true});
                  nextCut.active = true;
                  actions.updateCut(nextCut);
                }
              }}
              disabled={isDisabled}
            >
              {cut?.active ? <IconFilterOff /> : <IconFilter />}
            </ActionIcon>
            {properties && (
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
        {cut?.active && (
          <Box pt="md">
            <MultiSelect
              sx={{flex: "1 1 100%"}}
              searchable
              onChange={members => {
                if (cut) {
                  actions.updateCut({...cut, active: currentDrilldown.active, members});
                }
              }}
              placeholder={`Filter by ${label}`}
              value={cut?.members || []}
              data={currentDrilldown.members.map(m => {
                const idFormatter = idFormatters[`${label} ID`];
                const formattedKey = idFormatter ? idFormatter(m.key as any) : m.key;
                const key = formattedKey ? `(${formattedKey})` : formattedKey;
                return {
                  value: `${m.key}`,
                  label: m.caption ? `${m.caption} ${key}` : `${key}`
                };
              })}
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

  const activeProperties = filterMap(item.properties, item =>
    isActiveItem(item) ? item.key : null
  );

  const label = useMemo(() => {
    const triad = levelTriadMap[item.level] || [];
    const triadCaptions = triad.map(item => getCaption(item, locale.code)).reverse();
    return t("params.tag_drilldowns", {
      abbr: abbreviateFullName(triadCaptions, t("params.tag_drilldowns_abbrjoint")),
      dimension: triadCaptions[0],
      hierarchy: triadCaptions[1],
      level: triadCaptions[2],
      propCount: activeProperties.length
    });
  }, [activeProperties.length, levelTriadMap, item, locale.code, t]);

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
  if (filter.type) {
    return filter.type;
  }
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
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);

  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((query: QueryItem) => {
        updateUrl(query);
      }, 1000),
    []
  );

  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

  function getFilterValue(filter: FilterItem) {
    return isNotValid(filter.conditionOne[2]) ? "" : filter.conditionOne[2];
  }

  function onInputChange({filter, value}: {filter: FilterItem; value: number | ""}) {
    const isEmpty = value === "";
    const currentType = getFilterFn(filter) || "greaterThan";
    const conditions = getFiltersConditions(currentType, [value]) || {};
    const active = !isEmpty;
    const newFilter = buildFilter({...filter, active, ...conditions, type: currentType});
    actions.updateFilter(newFilter);

    const newQuery = buildQuery(cloneDeep(queryItem));
    newQuery.params.filters[filter.key] = newFilter;
    debouncedUpdateUrl(newQuery);
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

// Add hideControls to the MinMax props interface
interface MinMaxProps {
  filter: FilterItem;
  hideControls?: boolean; // Make it optional with ?
}

export const MinMax: React.FC<MinMaxProps> = ({filter, hideControls, ...rest}) => {
  const actions = useActions();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);

  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((query: QueryItem) => {
        updateUrl(query);
      }, 1000),
    []
  );

  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

  function onInputChangeMinMax(props: {filter: FilterItem; min: number | ""; max: number | ""}) {
    const {filter, min, max} = props;
    const currentType = getFilterFn(filter) || "between";
    const conditions = getFiltersConditions(currentType, [min, max]) || {};
    const active = min !== "" || max !== "";
    const newFilter = buildFilter({...filter, active, ...conditions, type: currentType});
    actions.updateFilter(newFilter);

    const newQuery = buildQuery(cloneDeep(queryItem));
    newQuery.params.filters[filter.key] = newFilter;
    debouncedUpdateUrl(newQuery);
  }

  function getFilterValue(condition?: [`${Comparison}`, string, number]) {
    if (condition) {
      return isNotValid(condition[2]) ? "" : condition[2];
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
        hideControls={hideControls}
        {...rest}
      />
      <NumberInput
        placeholder={"Max"}
        description={"Max"}
        value={max}
        onChange={value => onInputChangeMinMax({filter, min, max: value})}
        hideControls={hideControls}
        {...rest}
      />
    </Flex>
  );
};

export function FilterFnsMenu({filter}: {filter: FilterItem}) {
  const actions = useActions();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);
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
              const currentType = "greaterThan";
              const conditions = getFiltersConditions(currentType, [""]) || {};
              const newFilter = buildFilter({
                ...filter,
                ...conditions,
                active: false,
                type: currentType
              });
              actions.updateFilter(newFilter);

              const newQuery = buildQuery(cloneDeep(queryItem));
              newQuery.params.filters[filter.key] = newFilter;
              updateUrl(newQuery);
            }}
          >
            {t("comparison.GT")}
          </Menu.Item>
          <Menu.Item
            icon={<IconMathLower size={14} />}
            onClick={() => {
              const currentType = "lessThan";
              const conditions = getFiltersConditions(currentType, [""]) || {};
              const newFilter = buildFilter({
                ...filter,
                ...conditions,
                active: false,
                type: currentType
              });
              actions.updateFilter(newFilter);

              const newQuery = buildQuery(cloneDeep(queryItem));
              newQuery.params.filters[filter.key] = newFilter;
              updateUrl(newQuery);
            }}
          >
            {t("comparison.LT")}
          </Menu.Item>
          <Menu.Item
            icon={<IconArrowsLeftRight size={14} />}
            onClick={() => {
              const currentType = "between";
              const conditions = getFiltersConditions(currentType, ["", ""]) || {};
              const newFilter = buildFilter({
                ...filter,
                ...conditions,
                active: false,
                type: currentType
              });
              actions.updateFilter(newFilter);

              const newQuery = buildQuery(cloneDeep(queryItem));
              newQuery.params.filters[filter.key] = newFilter;
              updateUrl(newQuery);
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
  const measures = useMeasureItems();

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
              if (checked) {
                actions.updateFilter({...filter, active: false});
              }
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
const getIconForDimensionType = (dimensionType: DimensionType) => {
  switch (dimensionType) {
    case DimensionType.GEO:
      return <IconWorld size={20} />;
    case DimensionType.TIME:
      return <IconClock size={20} />;
    default:
      return <IconBox size={20} />;
  }
};

export default AddColumnsDrawer;
