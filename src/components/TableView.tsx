import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Flex,
  LoadingOverlay,
  MultiSelect,
  ScrollArea,
  Table,
  Text,
  rem,
  type MantineTheme
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
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import debounce from "lodash.debounce";
import {
  type MRT_ColumnDef as ColumnDef,
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
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
  useContext
} from "react";
import {useSelector} from "react-redux";
import {Comparison} from "../api";
import type {TesseractLevel, TesseractMeasure, TesseractProperty} from "../api/tesseract/schema";
import {useFormatter, useidFormatters} from "../hooks/formatter";
import {useKey, useUpdatePermaLink} from "../hooks/permalink";
import {type ExplorerBoundActionMap, useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectLoadingState} from "../state/loading";
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
import {selectOlapMeasureItems} from "../state/selectors";
import {filterMap} from "../utils/array";
import type {CutItem, DrilldownItem, FilterItem, MeasureItem, QueryResult} from "../utils/structs";
import {type AnyResultColumn, buildFilter, buildMeasure, buildProperty} from "../utils/structs";
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
import type {TesseractCube} from "../api/tesseract/schema";
import _ from "lodash";
import {useQueryItem} from "../context/query";
import {useLocation, useParams} from "react-router-dom";
export type CustomColumnDef<TData extends Record<string, any>> = ColumnDef<TData> & {
  dataType?: string;
};

type EntityTypes = "measure" | "level" | "property";
export type TData = Record<string, any> & Record<string, string | number>;

function isColumnSorted(column: string, key: string) {
  return column == key;
}

const propertiesUpdateHandler = (actions, item: DrilldownItem, activeProps: string[]) => {
  const properties = item.properties.map(prop =>
    buildProperty({
      ...prop,
      active: activeProps.includes(prop.key)
    })
  );
  actions.updateDrilldown({...item, properties});
};

const removeColumn = (
  actions: ExplorerBoundActionMap,
  entity: TesseractMeasure | TesseractProperty | TesseractLevel,
  measures: MeasureItem[],
  drilldowns: DrilldownItem[],
  type: EntityTypes
) => {
  if ("aggregator" in entity) {
    const measure = measures.find(d => d.name === entity.name);
    measure && actions.updateMeasure({...measure, active: false});
  }
  if ("depth" in entity) {
    const drilldown = drilldowns.find(d => d.level === entity.name);
    drilldown && actions.updateDrilldown({...drilldown, active: false});
  }

  if (isProperty(type)) {
    const activeDrilldowns = drilldowns.filter(d => d.active);
    const drilldown = activeDrilldowns.find(dd =>
      dd.properties.some(property => property.name === entity.name)
    );

    const activeProperties = drilldown?.properties
      .filter(p => p.active)
      .filter(p => p.name !== entity.name)
      .filter(p => p.active)
      .map(p => p.name);

    if (drilldown && activeProperties) {
      propertiesUpdateHandler(actions, drilldown, activeProperties);
    }
  }
};

const isProperty = (entity: EntityTypes) => entity === "property";

function showTrashIcon(columns: AnyResultColumn[], type: EntityTypes) {
  const result = columns.filter(c => c.entityType === type);
  return result.length > 1 || isProperty(type);
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

function removeFirstTwo(str) {
  return str.slice(2);
}

type TableProps = {
  cube: TesseractCube;
  result: QueryResult<Record<string, string | number>>;
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

function getLastWord(str) {
  const words = str.trim().split(" ");
  return words[words.length - 1];
}

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

type ApiResponse = {
  data: any;
  types: any;
  page: {
    total: number;
  };
};

// Create a context to manage table refresh state
interface TableRefreshContextType {
  setQueryEnabled: (enabled: boolean) => void;
  isQueryEnabled: boolean;
}

const TableRefreshContext = React.createContext<TableRefreshContextType | undefined>(undefined);

export function TableRefreshProvider({
  children,
  serverURL
}: {
  children: React.ReactNode;
  serverURL: string;
}) {
  const [isQueryEnabled, setQueryEnabled] = useState(true);

  // Add effect to set isQueryEnabled to true when serverURL changes
  useEffect(() => {
    setQueryEnabled(true);
  }, [serverURL]);

  const value = useMemo(
    () => ({
      isQueryEnabled,
      setQueryEnabled
    }),
    [isQueryEnabled]
  );

  return <TableRefreshContext.Provider value={value}>{children}</TableRefreshContext.Provider>;
}

// Hook to use the context
export function useTableRefresh() {
  const context = useContext(TableRefreshContext);
  if (context === undefined) {
    throw new Error("useTableRefresh must be used within a TableRefreshProvider");
  }
  return context;
}

export function useTableData({columns, pagination, cube}: useTableDataType) {
  const {query: queryitem, cube: queryCube} = useQueryItem();
  console.log(queryitem, queryCube, "query item");
  const {code: locale} = useSelector(selectLocale);
  const loadingState = useSelector(selectLoadingState);

  const permaKey = useKey();
  console.log("permaKey", permaKey);
  const actions = useActions();
  const pageSize = pagination.pageSize;
  const pageIndex = pagination.pageIndex;

  // Get query enabled state from context
  const {isQueryEnabled, setQueryEnabled} = useTableRefresh();

  // Only enable the query when there are columns AND isQueryEnabled is true
  const enabled = Boolean(columns.length) && isQueryEnabled;
  const key = permaKey ? [permaKey, pageIndex, pageSize] : permaKey;

  const query = useQuery<ApiResponse>({
    queryKey: ["table", key],
    queryFn: () =>
      actions.willFetchQuery().then(result => {
        actions.updateResult(result);
        setQueryEnabled(false);
        return result;
      }),
    staleTime: 300000,
    enabled: enabled && !!key,
    retry: false,
    placeholderData: keepPreviousData
  });

  useEffect(() => {
    if (query.data && !query.isFetching && isQueryEnabled) {
      setQueryEnabled(false);
    }
  }, [query.data, query.isFetching, isQueryEnabled, setQueryEnabled]);

  const client = useQueryClient();
  const cachedData = client.getQueryData(["table", key]);

  useUpdatePermaLink({
    isFetched: Boolean(cachedData),
    cube,
    enabled,
    isLoading: query.isLoading
  });

  // Update Redux pagination state whenever table pagination changes
  useEffect(() => {
    if (pageSize && pageIndex !== undefined) {
      actions.updatePagination({
        limit: pageSize,
        offset: pageIndex
      });
    }
  }, [pageSize, pageIndex, actions]);

  return query;
}

type usePrefetchType = {
  isPlaceholderData: boolean;
  limit: number;
  totalRowCount: number;
  pagination: MRT_PaginationState;
  isFetching: boolean;
};

function usePrefetch({
  isPlaceholderData,
  limit,
  totalRowCount,
  pagination,
  isFetching
}: usePrefetchType) {
  const queryClient = useQueryClient();
  const actions = useActions();
  const page = pagination.pageIndex + 1;
  const pageSize = pagination.pageSize;
  const hasMore = page * pageSize <= totalRowCount;
  const off = page * pageSize;
  const paramKey = useKey({pagiLimit: pageSize, pagiOffset: off});

  useEffect(() => {
    const key = [paramKey, page, pageSize];
    if (!isPlaceholderData && hasMore && !isFetching) {
      queryClient.prefetchQuery({
        queryKey: ["table", key],
        queryFn: () =>
          actions.willFetchQuery({offset: off, limit}).then(result => {
            actions.updateResult(result);
            return result;
          }),
        staleTime: 300000
      });
    }
  }, [limit, page, pageSize, isPlaceholderData, queryClient, hasMore, off, isFetching, paramKey]);
}

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
  result,
  columnFilter = () => true,
  columnSorting = columnSrt,
  ...mantineTableProps
}: TableProps & Partial<TableOptions<TData>>) {
  const filterItems = useSelector(selectFilterItems);
  const filtersMap = useSelector(selectFilterMap);
  const measuresOlap = useSelector(selectOlapMeasureItems);
  const measuresMap = useSelector(selectMeasureMap);
  const drilldowns = useSelector(selectDrilldownItems);
  const {code: locale} = useSelector(selectLocale);
  const measures = useSelector(selectMeasureItems);
  const actions = useActions();
  const {limit, offset} = useSelector(selectPaginationParams);
  const {setQueryEnabled} = useTableRefresh();

  // Initialize pagination state from Redux
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: offset,
    pageSize: limit
  });

  // Custom pagination handler that updates both local state and enables query
  const handlePaginationChange = useCallback(
    (updatedPagination: MRT_PaginationState) => {
      setPagination(updatedPagination);
      setQueryEnabled(true); // Enable the query when pagination changes
    },
    [setQueryEnabled]
  );

  const finalUniqueKeys = useMemo(
    () =>
      [
        ...measures.map(m => (m.active ? m.name : null)),
        ...drilldowns.map(d => (d.active ? d.level : null))
      ].filter(a => a !== null),
    [measures, drilldowns]
  );

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

  useEffect(() => {
    actions.updatePagination({
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize
    });
  }, [pagination]);

  const {translate: t} = useTranslation();
  const {getFormat, getFormatter} = useFormatter();
  const {idFormatters} = useidFormatters();

  const {sortKey, sortDir} = useSelector(selectSortingParams);

  const columns = useMemo<CustomColumnDef<TData>[]>(() => {
    const indexColumn = {
      id: "#",
      header: "#",
      Cell: ({row}) => row.index + 1 + offset,
      minWidth: 50,
      maxWidth: 50,
      width: 50,
      maxSize: 50,
      size: 50
    };

    const columnsDef = finalKeys.map(column => {
      const {
        entity,
        entityType,
        label: columnKey,
        localeLabel: header,
        valueType,
        range,
        isId
      } = column;

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

          return (
            <Box mb={rem(5)} key="header">
              <Flex justify="center" align="center">
                <Box sx={{flexGrow: 1}}>
                  <Flex gap="xs" align="center">
                    {getActionIcon(entityType)}
                    <Text size="sm">{header}</Text>
                    <ActionIcon
                      key={`sort-${header}`}
                      size={22}
                      ml={rem(5)}
                      onClick={() => {
                        if (!isSorted) {
                          actions.updateSorting({key: entity.name, dir: "desc"});
                        }
                        if (isSorted && sortDir === "desc") {
                          actions.updateSorting({key: entity.name, dir: "asc"});
                        }
                        if (isSorted && sortDir === "asc") {
                          actions.clearSorting();
                        }
                      }}
                    >
                      {getSortIcon(isSorted ? sortDir : false, entityType)}
                    </ActionIcon>
                  </Flex>
                </Box>
                {showTrashIcon(finalKeys, entityType) && (
                  <CustomActionIcon
                    label={`At least one ${getEntityText(entityType)} is required.`}
                    key={`remove-${column.columnDef.header}`}
                    disabled={!showTrashIcon(finalKeys, entityType)}
                    onClick={() => removeColumn(actions, entity, measures, drilldowns, entityType)}
                    showTooltip={!showTrashIcon(finalKeys, entityType)}
                    size={25}
                    ml={rem(5)}
                  >
                    <IconTrash />
                  </CustomActionIcon>
                )}
              </Flex>
            </Box>
          );
        },
        formatter,
        formatterKey,
        id: entity.name,
        dataType: valueType,
        accessorFn: item => item[columnKey],
        Cell: isNumeric
          ? ({cell}) => {
              return (
                <span style={{display: "block", textAlign: "right"}}>
                  {formatter(cell.getValue(), locale)}
                </span>
              );
            }
          : ({cell, renderedCellValue, row}) => {
              const cellId = row.original[`${cell.column.id} ID`];
              const idFormatter = idFormatters[`${cell.column.id} ID`];

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
                    {renderedCellValue}
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
          showRowsPerPage: false
        },
        paginationDisplayMode: "pages",
        enableRowVirtualization: false,
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
    [isError, t]
  );

  // const isTransitionState = status !== "success" && !isError;
  // const isLoad = isLoading || data === undefined || isTransitionState;
  // isLoading: isLoading || data === undefined || isTransitionState,
  const table = useMantineReactTable({
    columns,
    data: tableData,
    onPaginationChange: handlePaginationChange,
    enableHiding: false,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
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
    table,
    isError,
    isLoading,
    data: tableData,
    columns,
    pagination,
    setPagination: handlePaginationChange
  };
}

type TableView = {
  table: MRT_TableInstance<TData>;
  getColumn(id: string): AnyResultColumn | undefined;
  columns: AnyResultColumn[];
} & ViewProps;

export function TableView({
  table,
  result,
  isError,
  isLoading = false,
  data,
  pagination,
  setPagination
}: TableView) {
  // This is not accurate because mantine adds fake rows when is loading.
  const isData = Boolean(table.getRowModel().rows.length);
  const loadingState = useSelector(selectLoadingState);
  const viewport = useRef<HTMLDivElement>(null);

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
          <LoadingOverlay visible={isLoading || loadingState.loading} />
          <Table
            captionSide="top"
            fontSize="md"
            highlightOnHover
            horizontalSpacing="xl"
            striped
            verticalSpacing="xs"
            withBorder
            withColumnBorders
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
                      height: 60,
                      paddingBottom: 10,
                      minWidth: 210,
                      width: 300,
                      maxWidth: 450,
                      position: "sticky" as const,
                      fontSize: theme.fontSizes.sm,
                      top: 0,
                      display: "table-cell" as const
                    });

                    const index = (theme: MantineTheme) => ({
                      ...base(theme),
                      minWidth: 10,
                      width: 10,
                      maxWidth: 10,
                      size: 10
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
              <Box component="tbody">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <MRT_TableBodyCell
                        key={cell.id}
                        cell={cell}
                        rowIndex={row.index}
                        table={table}
                        rowRef={row.original.current}
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
          result={result}
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
  header;
  const filterVariant = header.column.columnDef.filterVariant;
  const isMulti = filterVariant === "multi-select";

  if (isMulti) {
    return <MultiFilter header={header} />;
  }

  if (isNumeric) {
    return <NumericFilter header={header} />;
  }
};

function NumericFilter({header}: {header: MRT_Header<TData>}) {
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
}

function MultiFilter({header}: {header: MRT_Header<TData>}) {
  const {translate: t} = useTranslation();
  const cutItems = useSelector(selectCutItems);
  const drilldownItems = useSelector(selectDrilldownItems);
  const label = header.column.id;
  const drilldown = drilldownItems.find(d => d.level === header.column.id);
  const actions = useActions();
  const {idFormatters} = useidFormatters();
  const cut = cutItems.find(cut => {
    return cut.level === drilldown?.level;
  });
  const {setQueryEnabled} = useTableRefresh();

  const updatecutHandler = React.useCallback((item: CutItem, members: string[]) => {
    actions.updateCut({...item, members});
  }, []);

  return (
    drilldown &&
    cut && (
      <Box pt="md" style={{fontWeight: "normal"}}>
        <MultiSelect
          sx={{flex: "1 1 100%"}}
          searchable
          onChange={value => {
            updatecutHandler({...cut, active: true}, value);
          }}
          onDropdownClose={() => {
            setQueryEnabled(true);
          }}
          placeholder={t("params.filter_by", {name: label})}
          value={cut.members || []}
          data={drilldown.members.map(m => {
            const idFormatter = idFormatters[`${label} ID`];
            const formattedKey = idFormatter ? idFormatter(m.key as any) : m.key;
            return {
              value: `${m.key}`,
              label: m.caption ? `${m.caption} (${formattedKey})` : `${formattedKey}`
            };
          })}
          clearButtonProps={{"aria-label": "Clear selection"}}
          clearable
          nothingFound="Nothing found"
          size="xs"
        />
      </Box>
    )
  );
}

const NoRecords = () => {
  return (
    <Center style={{height: "calc(100% - 210px)"}}>
      <Text size="xl" color="gray" italic>
        No records to display.
      </Text>
    </Center>
  );
};

export default TableView;

TableView.displayName = "TesseractExplorer:TableView";
