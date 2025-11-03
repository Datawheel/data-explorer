import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Flex,
  Group,
  LoadingOverlay,
  type MantineTheme,
  MultiSelect,
  ScrollArea,
  Table,
  Text,
  rem,
  useMantineTheme
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowsSort,
  IconTrash,
  IconSortAscendingLetters as SortAsc,
  IconSortDescendingLetters as SortDesc,
  IconSortAscendingNumbers as SortNAsc,
  IconSortDescendingNumbers as SortNDesc
} from "@tabler/icons-react";
import {cloneDeep, debounce} from "lodash-es";
import {
  type MRT_ColumnDef as ColumnDef,
  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Header,
  type MRT_PaginationState,
  MRT_TableBodyCell,
  type MRT_TableInstance,
  MRT_ToolbarAlertBanner,
  MRT_ProgressBar as ProgressBar,
  type MRT_TableOptions as TableOptions,
  flexRender,
  useMantineReactTable
} from "mantine-react-table";
import React, {useCallback, useEffect, useLayoutEffect, useMemo, useState, useRef} from "react";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import {Comparison} from "../api";
import type {
  TesseractLevel,
  TesseractMeasure,
  TesseractProperty,
  TesseractDimension
} from "../api/tesseract/schema";
import type {TesseractCube} from "../api/tesseract/schema";
import {useFormatter, useidFormatters} from "../hooks/formatter";
import {serializePermalink, useUpdateUrl} from "../hooks/permalink";
import {type ExplorerBoundActionMap, useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {useDimensionItems, useFetchQuery, useMeasureItems} from "../hooks/useQueryApi";
import {
  selectCutItems,
  selectDrilldownItems,
  selectFilterItems,
  selectFilterMap,
  selectLocale,
  selectMeasureItems,
  selectMeasureMap,
  selectPaginationParams,
  selectSortingParams
} from "../state/queries";
import {selectCurrentQueryItem} from "../state/queries";
import {filterMap} from "../utils/array";
import type {CutItem, DrilldownItem, FilterItem, MeasureItem, QueryResult} from "../utils/structs";
import {
  type AnyResultColumn,
  buildFilter,
  buildMeasure,
  buildProperty,
  buildQuery
} from "../utils/structs";
import type {QueryItem} from "../utils/structs";
import type {ViewProps} from "../utils/types";
import CustomActionIcon from "./CustomActionIcon";
import {
  FilterFnsMenu,
  MinMax,
  NumberInputComponent,
  getFilterFn,
  getFilterfnKey
} from "./DrawerMenu";
import TableFooter from "./TableFooter";
import {BarsSVG, StackSVG} from "./icons";
import {useMediaQuery} from "@mantine/hooks";

export type CustomColumnDef<TData extends Record<string, any>> = ColumnDef<TData> & {
  dataType?: string;
};

type EntityTypes = "measure" | "level" | "property";
export type TData = Record<string, string | number> & Record<string, any>;

function isColumnSorted(column: string, key: string) {
  return column == key;
}

function isRequiredColumn(
  column: AnyResultColumn,
  finalKeys: AnyResultColumn[],
  dimensions: TesseractDimension[]
) {
  if (column.entityType !== "level") return false;
  const dimCount = finalKeys.filter(
    c => c.entityType === "level" && c.entity.dimension === column.entity.dimension
  ).length;
  const dimension = dimensions.find(dim => dim.name === column.entity.dimension);
  const isRequired = dimension ? dimension.required && dimCount <= 1 : false;
  console.log({column, dimCount, isRequired, dimension});
  return isRequired;
}

const removeColumn = (
  queryItem: QueryItem,
  entity: TesseractMeasure | TesseractProperty | TesseractLevel
) => {
  const newQuery = buildQuery(cloneDeep(queryItem));
  const params = newQuery.params;

  if ("aggregator" in entity) {
    const measure = params.measures[entity.name];
    if (measure) {
      params.measures[entity.name] = {...measure, active: false};
      return newQuery;
    }
  } else if ("depth" in entity) {
    const cut = params.cuts[entity.name];
    if (cut) {
      params.cuts[cut.key] = {...cut, active: false};
    }
    const drilldown = params.drilldowns[entity.name];
    if (drilldown) {
      params.drilldowns[drilldown.key] = {...drilldown, active: false};
      return newQuery;
    }
  } else if ("level" in entity) {
    const mapPropertyToDrilldown = Object.fromEntries(
      Object.values(params.drilldowns)
        .filter(drilldown => drilldown.active)
        .flatMap(drilldown => drilldown.properties.map(prop => [prop.name, drilldown]))
    );
    const drilldown = mapPropertyToDrilldown[entity.name];
    if (drilldown) {
      params.drilldowns[drilldown.key] = {
        ...drilldown,
        properties: drilldown.properties.map(prop =>
          prop.name === entity.name ? {...prop, active: false} : prop
        )
      };
      return newQuery;
    }
  }
};

const isProperty = (entity: EntityTypes) => entity === "property";

function showTrashIcon(entity: AnyResultColumn, columns: AnyResultColumn[]) {
  const result = columns.filter(c => c.entityType === entity.entityType);
  return result.length > 1 || isProperty(entity.entityType);
}

const getActionIcon = (entityType: EntityTypes) => {
  if (entityType === "measure") {
    return (
      <ActionIcon size="md" color="red">
        <BarsSVG />
      </ActionIcon>
    );
  } else if (entityType === "level") {
    return (
      <ActionIcon size="md" color="blue">
        <StackSVG />
      </ActionIcon>
    );
  }
};

const getEntityText = (entityType: EntityTypes) => {
  switch (entityType) {
    case "measure":
      return "Metric";
    case "level":
      return "Dimension";
    case "property":
      return "Property";
    default:
      return "";
  }
};

function getMemberFilterFnTypes(member) {
  return {
    value: String(member.key),
    label: member.caption ? `${member.caption} ${member.key}` : `${member.key}`
  };
}
function getMantineFilterMultiSelectProps(isId: boolean, isNumeric: boolean, range) {
  let result: {
    filterVariant?: "multi-select" | "text";
    mantineFilterMultiSelectProps?: {
      data: (string | {value: string; label: string})[];
    };
  } = {};
  const filterVariant =
    !isId && !isNumeric && (!range || (range && range[1] - range[0] <= 100))
      ? "multi-select"
      : "text";
  result = Object.assign({}, result, {filterVariant});
  return result;
}

type SortDirection = "asc" | "desc" | false;

function getSortIcon(value: SortDirection, entityType: EntityTypes) {
  switch (value) {
    case "asc":
      return entityType === "measure" ? <SortNAsc /> : <SortAsc />;
    case "desc":
      return entityType === "measure" ? <SortNDesc /> : <SortDesc />;
    default:
      return <IconArrowsSort />;
  }
}

type TableProps = {
  cube: TesseractCube;
  /**
   * Defines which columns will be rendered and which will be hidden.
   * The function will be used as parameter for Array#filter() over a list
   * of descriptors for the columns.
   */
  columnFilter?: (column: AnyResultColumn) => boolean;
  /**
   * Defines the order in which the columns will be rendered.
   * The function will be used as parameter for Array#sort() over a list of
   * descriptors for the columns.
   */
  columnSorting?: (a: AnyResultColumn, b: AnyResultColumn) => number;
};

interface Condition {
  conditionOne: [string, string, number];
  conditionTwo?: [string, string, number];
  joint?: string;
}

type ComparisonFunction = (value: number[]) => Condition;

export function getFiltersConditions(fn: string, value: number[]) {
  const comparisonMap = new Map<string, ComparisonFunction>([
    [
      "greaterThan",
      (value: number[]): Condition => ({
        conditionOne: [Comparison.GTE, String(value[0]), Number(value[0])],
        conditionTwo: [Comparison.GT, "0", 0]
      })
    ],
    [
      "lessThan",
      (value: number[]): Condition => ({
        conditionOne: [Comparison.LTE, String(value[0]), Number(value[0])],
        conditionTwo: [Comparison.GT, "0", 0]
      })
    ],
    [
      "between",
      (values: number[]): Condition => {
        const [min, max] = values;
        return {
          conditionOne: [Comparison.GTE, String(min), Number(min)],
          conditionTwo: [Comparison.LTE, String(max), Number(max)],
          joint: "and"
        };
      }
    ]
  ]);

  return comparisonMap.get(fn)?.(value);
}

type useTableDataType = {
  columns: string[];
  pagination: MRT_PaginationState;
  cube: string;
};

export function useTableData({pagination}: useTableDataType) {
  const queryItem = useSelector(selectCurrentQueryItem);
  const queryLink = queryItem.link;
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;

  const query = useFetchQuery(queryItem.params, queryLink, {
    limit: pageSize,
    offset: pageIndex * pageSize
  });

  return query;
}

// type usePrefetchType = {
//   isPlaceholderData: boolean;
//   limit: number;
//   totalRowCount: number;
//   pagination: MRT_PaginationState;
//   isFetching: boolean;
// };

const columnSrt = (a: AnyResultColumn, b: AnyResultColumn) => {
  // Define order priority: level (dimension) first, then measure
  const order = {
    level: 0,
    property: 1,
    measure: 2
  };

  return (order[a.entityType] ?? 3) - (order[b.entityType] ?? 3);
};

export function useTable({
  cube,
  columnFilter = () => true,
  columnSorting = columnSrt,
  ...mantineTableProps
}: TableProps & Partial<TableOptions<TData>>) {
  const filterItems = useSelector(selectFilterItems);
  const filtersMap = useSelector(selectFilterMap);
  const measuresOlap = useMeasureItems();
  const measuresMap = useSelector(selectMeasureMap);
  const drilldowns = useSelector(selectDrilldownItems);
  const {code: locale} = useSelector(selectLocale);
  const measures = useSelector(selectMeasureItems);
  const dimensions = useDimensionItems();
  const actions = useActions();
  const {limit, offset} = useSelector(selectPaginationParams);
  const queryItem = useSelector(selectCurrentQueryItem);
  const updateURL = useUpdateUrl();

  const handlerCreateMeasure = useCallback((data: Partial<MeasureItem>) => {
    const measure = buildMeasure(data);
    actions.updateMeasure(measure);
    return measure;
  }, []);

  const handlerCreateFilter = useCallback((data: Partial<FilterItem>) => {
    const filter = buildFilter(data);
    actions.updateFilter(filter);
    return filter;
  }, []);

  useLayoutEffect(() => {
    filterMap(measuresOlap, m => {
      const measure = measuresMap[m.name] || handlerCreateMeasure({...m, active: false});
      const foundFilter = filtersMap[m.name] || filterItems.find(f => f.measure === measure.name);
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
    measuresMap,
    measuresOlap,
    filtersMap,
    filterItems,
    handlerCreateFilter,
    handlerCreateMeasure
  ]);

  const pagination = {
    pageIndex: Math.floor(offset / (limit || 1)),
    pageSize: limit
  };

  // Custom pagination handler that updates both local state and enables query
  const handlePaginationChange = updatedPagination => {
    const paginationUpdated = updatedPagination(pagination);

    actions.updatePagination({
      limit: paginationUpdated.pageSize,
      offset: paginationUpdated.pageIndex * paginationUpdated.pageSize
    });
    updateURL({
      ...queryItem,
      params: {
        ...queryItem.params,
        pagiOffset: paginationUpdated.pageIndex * paginationUpdated.pageSize,
        pagiLimit: paginationUpdated.pageSize
      }
    });
  };

  const finalUniqueKeys = useMemo(
    () =>
      [
        ...measures.map(m => (m.active ? m.name : null)),
        ...drilldowns.map(d => (d.active ? d.level : null))
      ].filter(a => a !== null),
    [measures, drilldowns]
  );

  const {isLoading, isFetching, isError, data} = useTableData({
    columns: finalUniqueKeys,
    pagination,
    cube: cube.name
  });

  const tableData = data?.data || [];
  const tableTypes: Record<string, AnyResultColumn> = data?.types || {};
  const totalRowCount = data?.page.total;
  /**
   * This array contains a list of all the columns to be presented in the Table
   * Each item is an object containing useful information related to the column
   * and its contents, for later use.
   */
  const finalKeys = Object.values(tableTypes)
    .map(d => {
      if (d.entityType === "level") {
        return {
          ...d,
          entity: {
            ...d.entity,
            dimension: drilldowns.find(dd => dd.key === d.entity.name)?.dimension || ""
          }
        };
      }
      return d;
    })
    .filter(t => !t.isId)
    .filter(columnFilter)
    .sort(columnSorting);

  // usePrefetch({
  //   isPlaceholderData,
  //   limit,
  //   totalRowCount: totalRowCount ?? 0,
  //   pagination,
  //   isFetching: isFetching || isLoading
  // });

  // }, [pagination]);

  const {translate: t} = useTranslation();
  const {getFormat, getFormatter} = useFormatter();
  const {idFormatters} = useidFormatters();
  const {sortKey, sortDir} = useSelector(selectSortingParams);
  const theme = useMantineTheme();
  const isSmallerThanMd = useMediaQuery(
    `(max-width: ${theme.breakpoints.md}${
      /(?:px|em|rem|vh|vw|%)$/.test(theme.breakpoints.xs) ? "" : "px"
    })`
  );
  const columns = useMemo<CustomColumnDef<TData>[]>(() => {
    const indexColumn = {
      id: "#",
      header: "#",
      accessorFn: (row: TData) => row.index,
      Cell: ({row}) => row.index + 1 + offset,
      minWidth: 50,
      maxWidth: 50,
      width: 50,
      maxSize: 50,
      size: 50
    };

    const columnsDef = finalKeys.map(keyCol => {
      const {
        entity,
        entityType,
        label: columnKey,
        localeLabel: header,
        valueType,
        range,
        isId
      } = keyCol;

      const isNumeric = valueType === "number" && columnKey !== "Year";

      const formatterKey = getFormat(
        "aggregator" in entity ? entity : columnKey,
        isNumeric ? "Decimal" : "identity"
      );

      const formatter = getFormatter(formatterKey);

      const mantineFilterVariantObject = getMantineFilterMultiSelectProps(isId, isNumeric, range);
      return {
        ...mantineFilterVariantObject,
        entityType,
        header,
        enableHiding: true,
        accessorFn: (row: TData) => row[columnKey],
        // This functions is not being used. Manual sorting is enabled.
        sortingFn: (rowA, rowB, columnId) => {
          if (rowA.original[columnId] < rowB.original[columnId]) {
            return -1;
          }
          if (rowA.original[columnId] > rowB.original[columnId]) {
            return 1;
          }
          return 0;
        },
        Header: ({column}) => {
          const isSorted = isColumnSorted(entity.name, sortKey);
          const showTrash =
            showTrashIcon(keyCol, finalKeys) && !isRequiredColumn(keyCol, finalKeys, dimensions);
          const isMobile = useMediaQuery(
            `(max-width: ${theme.breakpoints.sm}${
              /(?:px|em|rem|vh|vw|%)$/.test(theme.breakpoints.xs) ? "" : "px"
            })`
          );
          const actionSort = (
            <ActionIcon
              key={`sort-${header}`}
              size={22}
              ml={rem(5)}
              onClick={() => {
                if (!isSorted) {
                  actions.updateSorting({key: entity.name, dir: "desc"});

                  const newQuery = buildQuery(cloneDeep(queryItem));
                  updateURL({
                    ...newQuery,
                    params: {
                      ...newQuery.params,
                      sortKey: `${entity.name}`,
                      sortDir: "desc"
                    }
                  });
                }
                if (isSorted && sortDir === "desc") {
                  actions.updateSorting({key: entity.name, dir: "asc"});
                  const newQuery = buildQuery(cloneDeep(queryItem));
                  updateURL({
                    ...newQuery,
                    params: {
                      ...newQuery.params,
                      sortKey: `${entity.name}`,
                      sortDir: "asc"
                    }
                  });
                }
                if (isSorted && sortDir === "asc") {
                  actions.clearSorting();
                  const newQuery = buildQuery(cloneDeep(queryItem));

                  updateURL({
                    ...newQuery,
                    params: {
                      ...newQuery.params,
                      sortKey: undefined
                    }
                  });
                }
              }}
            >
              {getSortIcon(isSorted ? sortDir : false, entityType)}
            </ActionIcon>
          );
          return (
            <Box mb={rem(5)} key="header">
              <Flex
                justify="center"
                align={{base: "flex-start", sm: "center"}}
                direction={{base: "column", sm: "row"}}
              >
                <Box sx={{flexGrow: 1}} w={{base: "100%", sm: "auto"}}>
                  <Flex
                    gap={{base: 0, sm: "xs"}}
                    align="center"
                    justify={{base: "flex-start", sm: "space-between"}}
                  >
                    {getActionIcon(entityType)}
                    <Text size="sm">{header}</Text>
                    {!isMobile && <Box ml={"auto"}>{actionSort}</Box>}
                  </Flex>
                </Box>
                <Group position="apart" w={{base: "100%", sm: "auto"}}>
                  {isMobile && actionSort}
                  {showTrash && (
                    <CustomActionIcon
                      label={`At least one ${getEntityText(entityType)} is required.`}
                      key={`remove-${column.columnDef.header}`}
                      disabled={!showTrash || isLoading || isFetching}
                      onClick={() => {
                        const nextQueryItem = removeColumn(queryItem, entity);
                        if (nextQueryItem) {
                          actions.resetAllParams(nextQueryItem.params);
                          updateURL(nextQueryItem);
                        }
                      }}
                      showTooltip={!showTrash}
                      size={25}
                      ml={rem(5)}
                    >
                      <IconTrash />
                    </CustomActionIcon>
                  )}
                </Group>
              </Flex>
            </Box>
          );
        },
        formatter,
        formatterKey,
        id: entity.name,
        dataType: valueType,
        Cell: isNumeric
          ? ({cell}) => {
              return (
                <span style={{display: "block", textAlign: "right"}}>
                  {formatter(cell.getValue(), locale)}
                </span>
              );
            }
          : ({cell}) => {
              const cellValue = cell.getValue();
              const row = cell.row;
              const cellId = row.original[`${cell.column.id} ID`];
              const idFormatter = idFormatters[`${keyCol.localeLabel} ID`];

              return (
                <Flex justify="space-between" sx={{width: "100%", maxWidth: 400}} gap="sm">
                  <Text
                    size="sm"
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {cellValue}
                  </Text>
                  <Box>
                    {cellId && (
                      <Text color="dimmed">{idFormatter ? idFormatter(cellId) : cellId}</Text>
                    )}
                  </Box>
                </Flex>
              );
            }
      };
    });
    return columnsDef.length ? [indexColumn, ...columnsDef] : [];
  }, [drilldowns, measures, finalKeys, offset, getFormatter, getFormat, locale]);

  const constTableProps = useMemo(
    () =>
      ({
        mantineToolbarAlertBannerProps: isError
          ? {
              color: "red",
              children: "Error loading data."
            }
          : undefined,
        enableColumnFilterModes: true,
        enableColumnResizing: true,
        enableDensityToggle: false,
        enableFilterMatchHighlighting: true,
        enableGlobalFilter: true,
        mantinePaginationProps: {
          rowsPerPageOptions: ["10", "25", "50", "100"] as string[],
          showRowsPerPage: false
        },
        paginationDisplayMode: isSmallerThanMd ? "default" : "pages",
        globalFilterFn: "contains",
        initialState: {
          density: "xs"
        },

        mantineBottomToolbarProps: {
          id: "query-results-table-view-footer"
        },

        mantineTableProps: {
          sx: {
            "& td": {
              padding: "7px 10px !important"
            },
            tableLayout: "fixed"
          },
          withColumnBorders: true
        },

        mantinePaperProps: {
          id: "query-results-table-view",
          withBorder: false,
          sx: theme => ({
            height: "100%",
            display: "flex",
            flexFlow: "column nowrap",
            padding: `0 ${theme.spacing.sm}`,
            [theme.fn.largerThan("md")]: {
              padding: 0
            }
          })
        },
        mantineTableContainerProps: {
          id: "query-results-table-view-table",
          h: {base: "auto", md: 0},
          sx: {
            flex: "1 1 auto"
          }
        },
        mantineTopToolbarProps: {
          id: "query-results-table-view-toolbar",
          sx: {
            flex: "1 0 auto"
          }
        },
        renderBottomToolbar() {
          const [isOpen, setIsOpen] = useState(false);
          if (!isOpen) return null;
          return (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="yellow"
              withCloseButton
              onClose={() => setIsOpen(false)}
            >
              {t("table_view.slicedresult")}
            </Alert>
          );
        }
      } as const),
    [isError, t, isSmallerThanMd]
  );

  const table = useMantineReactTable<TData>({
    columns: columns as MRT_ColumnDef<TData>[],
    data: tableData as TData[],
    onPaginationChange: handlePaginationChange,
    enableHiding: false,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableRowVirtualization: false,
    rowCount: totalRowCount,
    state: {
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isFetching || isLoading
    },
    ...constTableProps,
    ...mantineTableProps
  });

  return {
    result: data,
    table,
    isError,
    isLoading,
    isFetching,
    data: tableData,
    columns,
    pagination
  };
}

type TableView = {
  table: MRT_TableInstance<TData>;
  getColumn(id: string): AnyResultColumn | undefined;
  columns: AnyResultColumn[];
  setPagination: (pagination: MRT_PaginationState) => void;
} & ViewProps;

export function TableView({
  table,
  isError,
  isLoading = false,
  data,
  pagination,
  setPagination,
  result
}: TableView) {
  // This is not accurate because mantine adds fake rows when is loading.
  const isData = Boolean(table.getRowModel().rows.length);
  const viewport = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const url = result?.url || "";
  const locale = useSelector(selectLocale);

  useEffect(() => {
    viewport.current?.scrollTo({top: 0, behavior: "smooth"});
  }, [pagination?.pageIndex, pagination?.pageSize]);

  return (
    <Box sx={{height: "100%"}}>
      <Flex direction="column" justify="space-between" sx={{height: "100%", flex: "1 1 auto"}}>
        <ProgressBar isTopToolbar={false} table={table} />
        <ScrollArea
          id="dex-table"
          h={isData ? "100%" : "auto"}
          viewportRef={viewport}
          sx={{
            flex: "1 1 auto",
            position: "relative",
            overflow: "scroll"
          }}
        >
          <LoadingOverlay visible={isLoading} />
          <Table
            captionSide="top"
            fontSize="md"
            highlightOnHover
            horizontalSpacing="xl"
            striped
            verticalSpacing="xs"
            withBorder
            withColumnBorders
            sx={t => ({
              "thead > tr > th": {
                padding: "0.5rem 1rem",
                [t.fn.smallerThan("sm")]: {
                  padding: "0.25rem 0.6rem"
                }
              }
            })}
          >
            <Box
              component="thead"
              sx={{
                position: "relative",
                top: 0,
                zIndex: 8
              }}
            >
              {table.getHeaderGroups().map(headerGroup => (
                <Box component="tr" key={headerGroup.id} sx={{fontWeight: "normal"}}>
                  {headerGroup.headers.map(header => {
                    const column = table.getColumn(header.id);

                    const isNumeric = (column.columnDef as any).dataType === "number";
                    const isRowIndex = column.id === "#";
                    const base = (theme: MantineTheme) => ({
                      backgroundColor:
                        theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
                      textAlign: isNumeric ? ("right" as const) : ("left" as const),
                      minWidth: 210,
                      width: 300,
                      maxWidth: 450,
                      position: "sticky" as const,
                      fontSize: theme.fontSizes.sm,
                      top: 0,
                      display: "table-cell" as const,
                      [theme.fn.smallerThan("sm")]: {
                        minWidth: 180,
                        width: 180
                      }
                    });

                    const index = (theme: MantineTheme) => ({
                      ...base(theme),
                      minWidth: 10,
                      width: 10,
                      maxWidth: 10,
                      size: 10,
                      [theme.fn.smallerThan("sm")]: {
                        minWidth: 5,
                        width: 5
                      }
                    });

                    return (
                      <Box
                        component="th"
                        key={header.id}
                        sx={theme => (isRowIndex ? index(theme) : base(theme))}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexFlow: "column",
                            height: "100%",
                            justifyContent: "space-between"
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.Header ?? header.column.columnDef.header,
                                header.getContext()
                              )}

                          {!isRowIndex && (
                            <ColumnFilterCell isNumeric={isNumeric} header={header} table={table} />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
            {isData && (
              <Box
                component="tbody"
                sx={t => ({
                  td: {
                    padding: "0.5rem 1rem !important",
                    fontSize: `${t.fontSizes.sm} !important`
                  },
                  "td:first-of-type": {
                    paddingLeft: "0.5rem !important",
                    paddingRight: "0.5rem !important",
                    minWidth: "0px !important"
                  }
                })}
              >
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} ref={rowRef}>
                    {row.getVisibleCells().map(cell => (
                      <MRT_TableBodyCell
                        key={cell.id}
                        cell={
                          cell as MRT_Cell<Record<string, string | number> & Record<string, any>>
                        }
                        rowIndex={row.index}
                        table={table}
                        rowRef={rowRef}
                      />
                    ))}
                  </tr>
                ))}
              </Box>
            )}
          </Table>
          {!isData && !isError && !isLoading && <NoRecords />}
        </ScrollArea>
        <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
        <TableFooter
          table={table}
          data={data}
          url={url}
          isLoading={isLoading}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Flex>
    </Box>
  );
}

const ColumnFilterCell = ({
  header,
  isNumeric
}: {
  header: MRT_Header<TData>;
  table?: MRT_TableInstance<TData>;
  isNumeric: boolean;
}) => {
  const filterVariant = header.column.columnDef.filterVariant;
  const isMulti = filterVariant === "multi-select";

  if (isMulti) {
    return <MultiFilter header={header} />;
  }

  if (isNumeric) {
    return <NumericFilter header={header} />;
  }
  return null;
};

const NumericFilter = ({header}: {header: MRT_Header<TData>}) => {
  const filters = useSelector(selectFilterItems);
  const {translate: t} = useTranslation();
  const filter = filters.find(f => f.measure === header.column.id);

  if (filter) {
    const filterFn = getFilterFn(filter);
    const text = t(`comparison.${getFilterfnKey(filterFn)}`);
    const isBetween = filterFn === "between";

    return (
      <Flex gap="xs" style={{fontWeight: "normal"}}>
        <Box sx={{flex: "1 1 auto"}}>
          {isBetween ? (
            <MinMax filter={filter} hideControls />
          ) : (
            <NumberInputComponent text={text} filter={filter} />
          )}
        </Box>
        <Box sx={{alignSelf: "flex-end"}}>
          <FilterFnsMenu filter={filter} />
        </Box>
      </Flex>
    );
  }
  return null;
};

const MultiFilter = ({header}: {header: MRT_Header<TData>}) => {
  const {translate: t} = useTranslation();
  const cutItems = useSelector(selectCutItems);
  const drilldownItems = useSelector(selectDrilldownItems);
  const locale = useSelector(selectLocale);
  const label = header.column.id;
  const localeLabel = header.column.columnDef.header;
  const drilldown = drilldownItems.find(d => d.level === header.column.id);
  const actions = useActions();
  const {idFormatters} = useidFormatters();
  const navigate = useNavigate();

  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((query: QueryItem) => {
        const currPermalink = window.location.search.slice(1);
        const nextPermalink = serializePermalink(query);
        if (currPermalink !== nextPermalink) {
          navigate(`?${nextPermalink}`, {replace: true});
        }
      }, 1000),
    [navigate]
  );

  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

  const cut = cutItems.find(cut => {
    return cut.level === drilldown?.level;
  });

  const updatecutHandler = useCallback(
    (item: CutItem, members: string[]) => {
      actions.updateCut({...item, members});
    },
    [actions]
  );

  const query = useSelector(selectCurrentQueryItem);

  if (!drilldown || !cut) return null;

  return (
    <Box pt="sm" style={{fontWeight: "normal"}}>
      <MultiSelect
        sx={{flex: "1 1 100%"}}
        searchable
        onChange={value => {
          const newCut = {...cut, active: true};
          updatecutHandler(newCut, value);
          const newQuery = buildQuery(cloneDeep(query));
          newQuery.params.cuts[cut.key] = {...newCut, members: value};
          debouncedUpdateUrl(newQuery);
        }}
        placeholder={t("params.filter_by", {name: localeLabel})}
        value={cut.members || []}
        data={drilldown.members.map(m => {
          const idFormatter = idFormatters[`${localeLabel} ID`];
          const formattedKey = idFormatter ? idFormatter(m.key as any) : m.key;
          const key = formattedKey ? `(${formattedKey})` : formattedKey;
          return {
            value: `${m.key}`,
            label: m.caption ? `${m.caption} ${key}` : `${key}`
          };
        })}
        clearButtonProps={{"aria-label": "Clear selection"}}
        clearable
        nothingFound="Nothing found"
        size="xs"
      />
    </Box>
  );
};

const NoRecords = React.memo(() => {
  return (
    <Center style={{height: "calc(100% - 210px)"}}>
      <Text size="xl" color="gray" italic>
        No records to display.
      </Text>
    </Center>
  );
});

export default TableView;

TableView.displayName = "TesseractExplorer:TableView";

// function usePrefetch({
//   isPlaceholderData,
//   limit,
//   totalRowCount,
//   pagination,
//   isFetching
// }: usePrefetchType) {
//   const queryClient = useQueryClient();
//   const actions = useActions();
//   const page = pagination.pageIndex + 1;
//   const pageSize = pagination.pageSize;
//   const hasMore = page * pageSize <= totalRowCount;
//   const off = page * pageSize;
//   const paramKey = useKey({pagiLimit: pageSize, pagiOffset: off});

//   useEffect(() => {
//     const key = [paramKey, page, pageSize];
//     if (!isPlaceholderData && hasMore && !isFetching) {
//       queryClient.prefetchQuery({
//         queryKey: ["table", key],
//         queryFn: () =>
//           actions.willFetchQuery({offset: off, limit}).then(result => {
//             actions.updateResult(result);
//             return result;
//           }),
//         staleTime: 300000
//       });
//     }
//   }, [limit, page, pageSize, isPlaceholderData, queryClient, hasMore, off, isFetching, paramKey]);
// }
