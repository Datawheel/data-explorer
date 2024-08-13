import {ActionIcon, Alert, Box, Flex, Text, rem, Table} from "@mantine/core";
import {IconAlertCircle, IconTrash} from "@tabler/icons-react";
import {
  MRT_ColumnDef as ColumnDef,
  MRT_TableOptions as TableOptions,
  useMantineReactTable,
  flexRender,
  MRT_TableHeadCellFilterContainer,
  MRT_TableBodyCell,
  MRT_TableHeadCell,
  MRT_TableInstance,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_ProgressBar as ProgressBar
} from "mantine-react-table";
import React, {useEffect, useMemo, useState} from "react";
import {useFormatter} from "../hooks/formatter";
import {useTranslation} from "../hooks/translation";
import {AnyResultColumn, buildCut} from "../utils/structs";
import {BarsSVG, StackSVG, PlusSVG} from "./icons";
import {selectCurrentQueryParams, selectCutItems, selectPaginationParams} from "../state/queries";
import {useSelector} from "react-redux";
import {PlainCube, PlainLevel, PlainMeasure, PlainProperty} from "@datawheel/olap-client";
import {ViewProps} from "../utils/types";
import OptionsMenu from "./OptionsMenu";
import {
  IconSortAscendingLetters as SortAsc,
  IconSortDescendingLetters as SortDesc,
  IconArrowsSort,
  IconSortAscendingNumbers as SortNAsc,
  IconSortDescendingNumbers as SortNDesc
} from "@tabler/icons-react";
import type {MeasureItem, QueryResult, DrilldownItem, CutItem} from "../utils/structs";
import {useActions, ExplorerBoundActionMap} from "../hooks/settings";
import TableFooter from "./TableFooter";
import CustomActionIcon from "./CustomActionIcon";
import {LoadingOverlay} from "./LoadingOverlay";
import {useQuery} from "@tanstack/react-query";

type EntityTypes = "measure" | "level" | "property";
type TData = Record<string, any> & Record<string, string | number>;

const removeColumn = (
  actions: ExplorerBoundActionMap,
  entity: PlainMeasure | PlainProperty | PlainLevel,
  measures: Record<string, MeasureItem>,
  drilldowns: Record<string, DrilldownItem>
) => {
  // check for measure
  if (entity._type === "measure") {
    if (entity.name) {
      // const measure = measures[entity.name];
      const measure = Object.values(measures).find(d => d.name === entity.name);
      measure && actions.updateMeasure({...measure, active: false});
      actions.willRequestQuery();
    }
  }
  if (entity._type === "level") {
    const drilldown = Object.values(drilldowns).find(d => d.fullName === entity?.fullName);
    drilldown && actions.updateDrilldown({...drilldown, active: false});
    actions.willRequestQuery();
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

const getColumnFilterOption = (entityType: EntityTypes) => {
  switch (entityType) {
    case "measure":
      return {columnFilterModeOptions: ["between", "greaterThan", "lessThan"]};
    case "level":
      return {columnFilterModeOptions: true};
    default:
      return {columnFilterModeOptions: true};
  }
};

function getMemberFilterFn(data, key: string) {
  const dd = data[0];
  if (dd[key + " " + "ID"]) {
    return member => `${member.caption} ${member.key}`;
  }
  return member => member.caption;
}

function getMantineFilterMultiSelectProps(
  isId: Boolean,
  isNumeric: Boolean,
  range,
  entity: PlainLevel | PlainMeasure | PlainProperty,
  drilldowns: Record<string, DrilldownItem>,
  data: TData[],
  columnKey: string,
  itemsCuts: CutItem[]
) {
  let result: {
    filterVariant?: "multi-select" | "text";
    mantineFilterMultiSelectProps?: {data: unknown};
  } = {};

  // const filterVariant = !isId && isNumeric && range && (range[1] - range[0] <= 50) ? "multi-select" : "text"
  const filterVariant =
    !isId && (!range || (range && range[1] - range[0] <= 50)) ? "multi-select" : "text";
  result = Object.assign({}, result, {filterVariant});

  if (result.filterVariant === "multi-select") {
    if (entity._type === "level") {
      const dd = Object.keys(drilldowns).reduce(
        (prev, key) => ({...prev, [drilldowns[key].fullName]: drilldowns[key]}),
        {}
      );
      const drilldwonData = dd[entity.fullName];
      if (drilldwonData && drilldwonData.members) {
        const getmemberFilterValue = getMemberFilterFn(data, columnKey);
        result = Object.assign({}, result, {
          mantineFilterMultiSelectProps: {
            data: drilldwonData.members.map(getmemberFilterValue)
          }
        });
      }
    }
  }
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

const useTableDataType = {};

//refetch whenever the URL changes (columnFilters, globalFilter, sorting, pagination)
function useTableData({offset, limit, columns}) {
  const actions = useActions();
  const key = ["table", limit, offset, ...columns];
  const enabled = key.length >= 5;
  return useQuery<UserApiResponse>({
    queryKey: key,
    queryFn: () => {
      return actions.willExecuteQuery();
    },
    staleTime: 30000
    // enabled
  });
}

// ViewPros
export function useTable({
  cube,
  result,
  columnFilter = () => true,
  columnSorting = () => 0,
  ...mantineTableProps
}: TableProps & Partial<TableOptions<TData>>) {
  const {types} = result;
  /**
   * This array contains a list of all the columns to be presented in the Table
   * Each item is an object containing useful information related to the column
   * and its contents, for later use.
   */
  const finalKeys = Object.values(types)
    .filter(t => !t.isId)
    .filter(columnFilter)
    .sort(columnSorting);

  // const finalUniqueKeys = finalKeys.map(c => c.entity?.fullName ?? c.entity?.name);

  const {locale, measures, drilldowns} = useSelector(selectCurrentQueryParams);

  const finalUniqueKeys = [
    ...Object.keys(measures).reduce((prev, curr) => {
      const measure = measures[curr];
      if (measure.active) {
        return [...prev, curr];
      }
      return prev;
    }, []),
    ...Object.keys(drilldowns).reduce((prev, curr) => {
      const dd = drilldowns[curr];
      if (dd.active) {
        return [...prev, curr];
      }
      return prev;
    }, [])
  ];

  const actions = useActions();
  const itemsCuts = useSelector(selectCutItems);
  const {limit, offset} = useSelector(selectPaginationParams);

  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: offset,
    pageSize: limit
  });
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);

  const {
    isLoading,
    isFetching,
    isError,
    data: tableData,
    refetch
  } = useTableData({
    offset,
    limit,
    columns: finalUniqueKeys
  });
  //this will depend on your API response shape
  const fetchedTableData = tableData ?? [];
  // const totalRowCount = data?.meta?.totalRowCount ?? 0;

  useEffect(() => {
    actions.updatePagination({
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize
    });
  }, [pagination]);

  const data = useMemo(
    () =>
      window.navigator.userAgent.includes("Firefox") ? result.data.slice(0, 10000) : result.data,
    [result.data]
  );

  const isLimited = result.data.length !== data.length;

  //So far this is a hardcoded count until api returns value
  const totalRowCount = result.data.length === limit ? limit * 10 : result.data.length;

  const {translate: t} = useTranslation();

  const {currentFormats, getAvailableKeys, getFormatter, getFormatterKey, setFormat} = useFormatter(
    cube.measures
  );

  const updatecutHandler = React.useCallback((item: CutItem, members: string[]) => {
    actions.updateCut({...item, members});
  }, []);

  function notFound(cut: CutItem, columnFilters: MRT_ColumnFiltersState) {
    // add case for measure
    const column = columnFilters.find(c => c.id === cut.fullName);
    return !column;
  }
  useEffect(() => {
    let cleaned = false;
    for (const columnFilter of columnFilters) {
      const column = finalKeys.find(f => {
        if (f.entity._type === "level") {
          return f.entity?.fullName === columnFilter.id;
        }
        return f.entity.name === columnFilter.id;
      });

      if (column?.entity._type === "level") {
        const cut = itemsCuts.find(cut => cut.fullName === column?.entity.fullName);
        if (Array.isArray(columnFilter.value)) {
          const members: string[] = columnFilter.value.map(str => getLastWord(str));
          if (cut) {
            updatecutHandler({...cut, active: true}, members);
            refetch();
          }
        }
      }
    }

    for (const cut of itemsCuts) {
      if (cut.active && notFound(cut, columnFilters)) {
        updatecutHandler({...cut, active: false}, []);
        cleaned = true;
      }
    }

    if (cleaned) {
      refetch();
    }
  }, [columnFilters]);

  const columns = useMemo<ColumnDef<TData>[]>(() => {
    return finalKeys.map(column => {
      const {
        entity,
        entityType,
        label: columnKey,
        localeLabel: header,
        valueType,
        range,
        isId
      } = column;
      const isNumeric = valueType === "number";
      const formatterKey = getFormatterKey(columnKey) || (isNumeric ? "Decimal" : "identity");
      const formatter = getFormatter(formatterKey);
      const filterOption = getColumnFilterOption(entityType);
      const mantineFilterVariantObject = getMantineFilterMultiSelectProps(
        isId,
        isNumeric,
        range,
        entity,
        drilldowns,
        data,
        columnKey,
        itemsCuts
      );

      return {
        ...filterOption,
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
                    <Text size="md" color="black">
                      {column.columnDef.header}
                    </Text>
                    <ActionIcon
                      key={`sort-${column.columnDef.header}`}
                      size={22}
                      ml={rem(5)}
                      onClick={column.getToggleSortingHandler()}
                    >
                      {getSortIcon(column.getIsSorted(), entityType)}
                    </ActionIcon>
                  </Flex>
                  <Text ml={rem(30)} size="sm" color="dimmed" fw="normal">
                    {getEntityText(entityType)}
                  </Text>
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
        size: isId ? 80 : undefined,
        formatter,
        formatterKey,
        id: entity.fullName ?? entity.name,
        dataType: valueType,
        accessorFn: item => {
          if (item[columnKey + " " + "ID"]) {
            return {value: item[columnKey], id: item[columnKey + " " + "ID"]};
          }
          return item[columnKey];
        },
        Cell: isNumeric
          ? ({cell}) => formatter(cell.getValue<number>())
          : ({renderedCellValue}) => {
              if (renderedCellValue && typeof renderedCellValue === "object") {
                return (
                  <Flex justify="space-between" sx={{width: "100%"}}>
                    <Box>{renderedCellValue.value}</Box>
                    <Box>
                      <Text color="dimmed">{renderedCellValue.id}</Text>
                    </Box>
                  </Flex>
                );
              }
            }
      };
    });
  }, [currentFormats, data, types, drilldowns, measures]);

  const constTableProps = useMemo(
    () =>
      ({
        enableBottomToolbar: isLimited,
        enableColumnFilterModes: true,
        enableColumnResizing: true,
        enableDensityToggle: false,
        enableFilterMatchHighlighting: true,
        enableGlobalFilter: true,
        mantinePaginationProps: {
          showRowsPerPage: false
        },
        paginationDisplayMode: "pages",
        enableRowNumbers: true,
        rowNumberMode: "static",
        displayColumnDefOptions: {
          "mrt-row-numbers": {
            size: 10,
            maxSize: 25,
            enableOrdering: true
          }
        },
        enableRowVirtualization: false,
        globalFilterFn: "contains",
        initialState: {
          density: "xs",
          showColumnFilters: true
        },
        mantineBottomToolbarProps: {
          id: "query-results-table-view-footer"
        },
        mantineTableProps: {
          sx: {
            "& td": {
              padding: "7px 10px!important"
            }
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
          const [isOpen, setIsOpen] = useState(isLimited);
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
    [isLimited]
  );

  const table = useMantineReactTable({
    columns,
    data: fetchedTableData,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    enableHiding: false,
    manualFiltering: true,
    manualPagination: true,
    rowCount: totalRowCount,
    state: {
      // columnFilterFns,
      columnFilters,
      isLoading: isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isFetching
      // sorting,
    },
    ...constTableProps,
    ...mantineTableProps
  });

  return {table};
}

type TableView = {
  table: MRT_TableInstance<TData>;
  getColumn(id: String): AnyResultColumn | undefined;
} & ViewProps;

export function TableView({table, result}: TableView) {
  return (
    <Box sx={{height: "100%"}}>
      {/* <LoadingOverlay /> */}
      <ProgressBar isTopToolbar table={table} />
      <Flex justify="space-between" align="center" sx={{height: "100%"}}>
        <Flex direction="column" justify="space-between" sx={{height: "100%", flex: "1 1 auto"}}>
          <Box
            sx={{
              flex: "1 1 auto",
              height: "100%",
              maxHeight: "calc(100vh - 210px)",
              position: "relative",
              overflow: "scroll"
            }}
          >
            <Table
              sx={{overflow: "scroll"}}
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
                  opacity: 0.97,
                  top: 0
                }}
              >
                {table.getHeaderGroups().map(headerGroup => (
                  <Box component="tr" key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      const column = table.getColumn(header.id);
                      if (column.id !== "mrt-row-numbers") {
                        const isNumeric = column.columnDef.dataType === "number";
                        return (
                          <Box
                            component="th"
                            key={header.id}
                            sx={theme => ({
                              backgroundColor: theme.colors.gray[0],
                              align: isNumeric ? "right" : "left",
                              height: 60,
                              paddingBottom: 10,
                              width: 300,
                              position: "sticky",
                              top: 0,
                              display: "table-cell"
                            })}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.Header ?? header.column.columnDef.header,
                                  header.getContext()
                                )}
                            <MRT_TableHeadCellFilterContainer header={header} table={table} />
                          </Box>
                        );
                      } else {
                        return (
                          <>
                            <Box
                              component="th"
                              key={header.id}
                              sx={() => ({
                                width: 100,
                                maxWidth: 140,
                                position: "sticky",
                                top: 0,
                                backgroundColor: "white",
                                display: "table-cell"
                              })}
                            >
                              <Box>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.Header ??
                                        header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </Box>
                            </Box>
                          </>
                        );
                      }
                    })}
                  </Box>
                ))}
              </Box>
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
            </Table>
          </Box>
          {/* <MRT_ToolbarAlertBanner stackAlertBanner table={table} /> */}
          <TableFooter table={table} result={result} />
        </Flex>
        <Box px="xl" py={"sm"} sx={{alignSelf: "self-start"}}>
          <OptionsMenu>
            <PlusSVG />
          </OptionsMenu>
        </Box>
      </Flex>
    </Box>
  );
}

export default TableView;

TableView.displayName = "TesseractExplorer:TableView";
