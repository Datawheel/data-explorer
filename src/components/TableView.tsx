import {
  ActionIcon,
  Alert,
  Box,
  Flex,
  Text,
  rem,
  Table,
  Center,
  MultiSelect,
  ScrollArea,
  LoadingOverlay
} from "@mantine/core";
import {IconAlertCircle, IconTrash} from "@tabler/icons-react";
import {
  MRT_ColumnDef as ColumnDef,
  MRT_TableOptions as TableOptions,
  useMantineReactTable,
  flexRender,
  MRT_TableBodyCell,
  MRT_TableInstance,
  MRT_PaginationState,
  MRT_ToolbarAlertBanner,
  MRT_ProgressBar as ProgressBar,
  MRT_Header
} from "mantine-react-table";
import React, {useEffect, useLayoutEffect, useMemo, useState} from "react";
import {useFormatter} from "../hooks/formatter";
import {useTranslation} from "../hooks/translation";
import {AnyResultColumn, buildFilter, buildMeasure} from "../utils/structs";
import {BarsSVG, StackSVG} from "./icons";
import {
  selectCutItems,
  selectDrilldownItems,
  selectFilterItems,
  selectFilterMap,
  selectLocale,
  selectMeasureItems,
  selectMeasureMap,
  selectPaginationParams
} from "../state/queries";
import {useSelector} from "react-redux";
import {
  PlainCube,
  PlainLevel,
  PlainMeasure,
  PlainProperty,
  Comparison
} from "@datawheel/olap-client";
import {ViewProps} from "../utils/types";
import {
  IconSortAscendingLetters as SortAsc,
  IconSortDescendingLetters as SortDesc,
  IconArrowsSort,
  IconSortAscendingNumbers as SortNAsc,
  IconSortDescendingNumbers as SortNDesc
} from "@tabler/icons-react";
import type {MeasureItem, QueryResult, DrilldownItem, CutItem, FilterItem} from "../utils/structs";
import {useActions, ExplorerBoundActionMap} from "../hooks/settings";
import TableFooter from "./TableFooter";
import CustomActionIcon from "./CustomActionIcon";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {isActiveCut, isActiveItem} from "../utils/validation";
import {
  FilterFnsMenu,
  getFilterFn,
  getFilterfnKey,
  MinMax,
  NumberInputComponent
} from "./DrawerMenu";
import debounce from "lodash.debounce";
import {selectOlapMeasureItems} from "../state/selectors";
import {filterMap} from "../utils/array";
import {useUpdatePermaLink, useKey} from "../hooks/permalink";
import {selectLoadingState} from "../state/loading";

type EntityTypes = "measure" | "level" | "property";
type TData = Record<string, any> & Record<string, string | number>;

const removeColumn = (
  actions: ExplorerBoundActionMap,
  entity: PlainMeasure | PlainProperty | PlainLevel,
  measures: MeasureItem[],
  drilldowns: DrilldownItem[]
) => {
  if (entity._type === "measure") {
    if (entity.name) {
      const measure = measures.find(d => d.name === entity.name);
      measure && actions.updateMeasure({...measure, active: false});
    }
  }
  if (entity._type === "level") {
    const drilldown = drilldowns.find(d => d.uniqueName === entity?.uniqueName);
    drilldown && actions.updateDrilldown({...drilldown, active: false});
  }
  // maybe need to handle case for property columns.
};

function showTrashIcon(columns: AnyResultColumn[], type: EntityTypes) {
  const result = columns.filter(c => c.entityType === type);
  return result.length > 1;
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
    default:
      return "";
  }
};

function getMemberFilterFnTypes(member) {
  return {
    value: String(member.key),
    label: member.caption ? `${member.caption} ${member.key}` : member.name
  };
}
function getMantineFilterMultiSelectProps(isId: Boolean, isNumeric: Boolean, range) {
  let result: {
    filterVariant?: "multi-select" | "text";
    mantineFilterMultiSelectProps?: {data: unknown};
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
  cube: PlainCube;
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
type UserApiResponse = any;

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
  cuts: CutItem[];
  columns: string[];
  filters: FilterItem[];
  pagination: MRT_PaginationState;
  cube: string;
  drilldowns: DrilldownItem[];
  measures: MeasureItem[];
};

type ApiResponse = {data: any; types: any};

function useTableData({
  columns,
  filters,
  cuts,
  pagination,
  cube,
  drilldowns,
  measures
}: useTableDataType) {
  const {code: locale} = useSelector(selectLocale);
  const permaKey = useKey();
  console.log(permaKey, "params");

  const loadingState = useSelector(selectLoadingState);
  console.log(loadingState, "loadingState2");

  const actions = useActions();
  const page = pagination.pageIndex;
  console.log(columns, filters, cuts, loadingState.loading, drilldowns, measures);

  // const enabled = Boolean(columns.length) || Boolean(filters.length) || Boolean(cuts.length);
  const enabled = Boolean(columns.length);

  const initialKey = permaKey ? [permaKey, page] : permaKey;
  const [filterKeydebouced, setDebouncedTerm] = useState<
    string | boolean | (string | boolean | number)[]
  >(initialKey);

  useEffect(() => {
    if (!enabled && permaKey) return;
    const handler = debounce(
      () => {
        const term = [permaKey, page];
        setDebouncedTerm(term);
      },
      loadingState.loading ? 0 : 700
    );
    handler();
    return () => handler.cancel();
  }, [page, enabled, cube, locale, permaKey]);

  const query = useQuery<ApiResponse>({
    queryKey: ["table", filterKeydebouced],
    queryFn: () => {
      return actions.willExecuteQuery().then(res => {
        const {data, types} = res;
        const {data: tableData, page} = data;
        // actions.setLoadingState("SUCCESS");
        return {data: tableData ?? [], types, page};
      });
    },
    staleTime: 300000,
    enabled: enabled && !!filterKeydebouced
    // placeholderData: (previousData, previousQuery) => previousData
  });
  const client = useQueryClient();
  const cachedData = client.getQueryData(["table", filterKeydebouced]);
  useUpdatePermaLink({isFetched: Boolean(cachedData), cube, enabled, isLoading: query.isLoading});
  return query;
}

type usePrefetchType = {
  isPlaceholderData: boolean;
  limit: number;
  totalRowCount: number;
  cuts: CutItem[];
  columns: string[];
  filters: FilterItem[];
  pagination: MRT_PaginationState;
  isFetching: boolean;
  cube: string;
};

// update when pagination api is set.
function usePrefetch({
  isPlaceholderData,
  limit,
  totalRowCount,
  pagination,
  isFetching
}: usePrefetchType) {
  const {code: locale} = useSelector(selectLocale);
  const queryClient = useQueryClient();
  const actions = useActions();
  const paramKey = useKey();
  const page = pagination.pageIndex + 1;
  const hasMore = page * pagination.pageSize <= totalRowCount;
  const off = page * pagination.pageSize;
  const key = [paramKey, page];

  React.useEffect(() => {
    if (!isPlaceholderData && hasMore && !isFetching) {
      queryClient.prefetchQuery({
        queryKey: ["table", key],
        queryFn: () => {
          return actions.willExecuteQuery({offset: off, limit}).then(res => {
            const {data, types} = res;
            const {data: tableData, page} = data;
            return {data: tableData ?? [], types, page};
          });
        },
        staleTime: 300000
      });
    }
  }, [
    limit,
    page,
    isPlaceholderData,
    key,
    queryClient,
    hasMore,
    off,
    isFetching,
    locale,
    paramKey
  ]);
}

export function useTable({
  cube,
  result,
  columnFilter = () => true,
  columnSorting = () => 0,
  ...mantineTableProps
}: TableProps & Partial<TableOptions<TData>>) {
  // const {types} = result;
  const filterItems = useSelector(selectFilterItems);
  const filtersMap = useSelector(selectFilterMap);
  const measuresOlap = useSelector(selectOlapMeasureItems);
  const measuresMap = useSelector(selectMeasureMap);
  const drilldowns = useSelector(selectDrilldownItems);
  const measures = useSelector(selectMeasureItems);
  const itemsCuts = useSelector(selectCutItems);
  const actions = useActions();
  const {limit, offset} = useSelector(selectPaginationParams);

  const loadingState = useSelector(selectLoadingState);
  console.log(loadingState, "loadingState1");

  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: offset,
    pageSize: limit
  });
  const finalUniqueKeys = useMemo(
    () =>
      [
        ...measures.map(m => (m.active ? m.name : null)),
        ...drilldowns.map(d => (d.active ? d.uniqueName : null))
      ].filter(a => a !== null),
    [measures, drilldowns]
  );

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

  useLayoutEffect(() => {
    filterMap(measuresOlap, (m: MeasureItem) => {
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
  }, [measuresMap, measuresOlap, filtersMap, filterItems]);

  const {isLoading, isFetching, isError, data, isPlaceholderData, status, fetchStatus} =
    useTableData({
      columns: finalUniqueKeys,
      filters: filterItems.filter(
        f =>
          isActiveItem(f) &&
          isActiveItem(measures.find(m => m.name === f.measure) || {active: false})
      ),
      cuts: itemsCuts.filter(isActiveCut),
      pagination,
      cube: cube.name,
      drilldowns,
      measures
    });

  // check no data
  const tableData = data?.data || [];
  // const tableTypes = (data?.types as Record<string, AnyResultColumn>) || types;
  const tableTypes = data?.types || {};
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

  usePrefetch({
    isPlaceholderData,
    limit,
    totalRowCount,
    columns: finalUniqueKeys,
    filters: filterItems.filter(isActiveItem),
    cuts: itemsCuts.filter(isActiveCut),
    pagination,
    isFetching: isFetching || isLoading,
    cube: cube.name
  });

  useEffect(() => {
    actions.updatePagination({
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize
    });
  }, [pagination, actions]);

  const {translate: t} = useTranslation();

  const {currentFormats, getAvailableKeys, getFormatter, getFormatterKey, setFormat} = useFormatter(
    cube.measures
  );

  const columns = useMemo<ColumnDef<TData>[]>(() => {
    const indexColumn = {
      id: "#",
      Header: "#",
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
      const formatterKey = getFormatterKey(columnKey) || (isNumeric ? "Decimal" : "identity");
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
          return (
            <Box mb={rem(5)}>
              <Flex justify="center" align="center">
                <Box sx={{flexGrow: 1}}>
                  <Flex gap="xs" align="center">
                    {getActionIcon(entityType)}
                    <Text size="sm">{column.columnDef.header}</Text>
                    <ActionIcon
                      key={`sort-${column.columnDef.header}`}
                      size={22}
                      ml={rem(5)}
                      onClick={column.getToggleSortingHandler()}
                    >
                      {getSortIcon(column.getIsSorted(), entityType)}
                    </ActionIcon>
                  </Flex>
                  {/* <Text ml={rem(30)} size="sm" color="dimmed" fw="normal">
                    {getEntityText(entityType)}
                  </Text> */}
                </Box>
                <CustomActionIcon
                  label={`At least one ${getEntityText(entityType)} is required.`}
                  key={`remove-${column.columnDef.header}`}
                  disabled={!showTrashIcon(finalKeys, entityType)}
                  onClick={() => removeColumn(actions, entity, measures, drilldowns)}
                  showTooltip={!showTrashIcon(finalKeys, entityType)}
                  size={25}
                  ml={rem(5)}
                >
                  <IconTrash />
                </CustomActionIcon>
              </Flex>
            </Box>
          );
        },
        formatter,
        formatterKey,
        id: entity.uniqueName ?? entity.name,
        dataType: valueType,
        accessorFn: item => item[columnKey],
        Cell: isNumeric
          ? ({cell}) => formatter(cell.getValue<number>())
          : ({cell, renderedCellValue, row}) => {
              const cellId = row.original[`${cell.column.id} ID`];
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
                  <Box>{cellId && <Text color="dimmed">{cellId}</Text>}</Box>
                </Flex>
              );
            }
      };
    });
    return columnsDef.length ? [indexColumn, ...columnsDef] : [];
  }, [currentFormats, tableData, tableTypes, drilldowns, measures]);

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
    [isError]
  );

  const isTransitionState = status !== "success" && !isError;
  const isLoad = isLoading || data === undefined || isTransitionState;

  const table = useMantineReactTable({
    columns,
    data: tableData,
    onPaginationChange: setPagination,
    enableHiding: false,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: false,
    rowCount: totalRowCount,
    state: {
      isLoading: isLoading || data === undefined || isTransitionState,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isFetching || isLoading
    },
    ...constTableProps,
    ...mantineTableProps
  });

  return {table, isError, isLoading: isLoad, data: tableData, columns};
}

type TableView = {
  table: MRT_TableInstance<TData>;
  getColumn(id: String): AnyResultColumn | undefined;
  columns: AnyResultColumn[];
} & ViewProps;

export function TableView({table, result, isError, isLoading = false, data, columns}: TableView) {
  // This is not accurate because mantine adds fake rows when is loading.
  const isData = Boolean(table.getRowModel().rows.length);
  const loadingState = useSelector(selectLoadingState);

  console.log(columns.length, isLoading, loadingState, "LOA");

  return (
    <Box sx={{height: "100%"}}>
      <Flex direction="column" justify="space-between" sx={{height: "100%", flex: "1 1 auto"}}>
        <ProgressBar isTopToolbar={false} table={table} />
        <ScrollArea
          h={isData ? "100%" : "auto"}
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
                zIndex: 10
              }}
            >
              {table.getHeaderGroups().map(headerGroup => (
                <Box component="tr" key={headerGroup.id} sx={{fontWeight: "normal"}}>
                  {headerGroup.headers.map(header => {
                    const column = table.getColumn(header.id);
                    const isNumeric = column.columnDef.dataType === "number";
                    const isRowIndex = column.id === "#";
                    const base = theme => ({
                      backgroundColor:
                        theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
                      align: isNumeric ? "right" : "left",
                      height: 60,
                      paddingBottom: 10,
                      minWidth: 210,
                      width: 300,
                      maxWidth: 450,
                      position: "sticky",
                      fontSize: theme.fontSizes.sm,
                      top: 0,
                      display: "table-cell"
                    });

                    const index = theme => ({
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
        <TableFooter table={table} data={data} result={result} isLoading={isLoading} />
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
  const drilldown = drilldownItems.find(c => c.uniqueName === header.column.id);
  const actions = useActions();

  const cut = cutItems.find(cut => {
    return cut.uniqueName === drilldown?.uniqueName;
  });

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
          placeholder={t("params.filter_by", {name: label})}
          value={cut.members || []}
          data={drilldown.members.map(m => ({
            value: String(m.key),
            label: m.caption ? `${m.caption} (${m.key})` : m.name
          }))}
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
