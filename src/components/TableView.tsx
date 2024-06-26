import {
  ActionIcon,
  Box,
  MantineTheme,
  Flex,
  Text,
  rem,
  Stack,
  Table,
} from "@mantine/core";
import {
  MRT_ColumnDef as ColumnDef,
  MRT_TableOptions as TableOptions,
  useMantineReactTable,
  flexRender,
  MRT_TablePagination,
  MRT_ToolbarAlertBanner,
  MRT_TableHeadCellFilterContainer,
  MRT_TableBodyCell,
  MRT_ToolbarInternalButtons,
  MRT_GlobalFilterTextInput,
} from "mantine-react-table";
import React, {useMemo, Fragment} from "react";
import {useFormatter} from "../hooks/formatter";
import {AnyResultColumn} from "../utils/structs";
import {ViewProps} from "../utils/types";
import {BarsSVG, StackSVG, EyeSVG, PlusSVG} from "./icons";
import {selectCurrentQueryParams} from "../state/queries";
import {useSelector} from "react-redux";
import {PlainLevel, PlainMeasure, PlainProperty} from "@datawheel/olap-client";
import {DrilldownItem} from "../utils/structs";
import OptionsMenu from "./OptionsMenu";
import {
  IconSortAscendingLetters as SortAsc,
  IconSortDescendingLetters as SortDesc,
  IconArrowsSort,
  IconSortAscendingNumbers as SortNAsc,
  IconSortAscendingNumbers as SortNDesc,
} from "@tabler/icons-react";
import {hasProperty} from "../utils/validation";
import {ModeTabs} from "./ModeTabs";

type EntityTypes = "measure" | "level" | "property";
type TData = Record<string, string | number>;

const getEntityColor = (entityType: EntityTypes, theme: MantineTheme) => {
  if (entityType === "measure") {
    return theme.fn.lighten(theme.colors.red[8], 0.9);
  }
  if (entityType === "level") {
    return theme.fn.lighten(theme.colors.blue[8], 0.9);
  }
  return theme.fn.lighten(theme.colors.green[8], 0.9);
};

const getActionIcon = (entityType: EntityTypes) => {
  if (entityType === "measure") {
    return (
      <ActionIcon size="md" color="red">
        <BarsSVG />
      </ActionIcon>
    );
  }
  if (entityType === "level") {
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
  if (dd[`${key} ID`]) {
    return member => `${member.caption} ${member.key}`;
  }
  return member => member.caption;
}

function getMantineFilterMultiSelectProps(
  isId: boolean,
  isNumeric: boolean,
  range,
  entity: PlainLevel | PlainMeasure | PlainProperty,
  drilldowns: Record<string, DrilldownItem>,
  data: TData[],
  columnKey: string,
) {
  let result: Partial<ColumnDef<TData>> = {};

  // const filterVariant = !isId && isNumeric && range && (range[1] - range[0] <= 50) ? "multi-select" : "text"
  const filterVariant =
    !isId && (!range || (range && range[1] - range[0] <= 50))
      ? "multi-select"
      : "text";
  result = Object.assign({}, result, {filterVariant});

  if (result.filterVariant === "multi-select") {
    if (entity._type === "level") {
      if (entity.fullName) {
        const dd = Object.fromEntries(
          Object.keys(drilldowns).map(key => {
            const dd = drilldowns[key];
            return [dd.fullName, dd];
          }),
        );
        const drilldwonData = dd[entity.fullName];

        if (drilldwonData?.members) {
          const getmemberFilterValue = getMemberFilterFn(data, columnKey);
          result = Object.assign({}, result, {
            mantineFilterMultiSelectProps: {
              data: drilldwonData.members.map(getmemberFilterValue),
            },
            filterFn: (row, id, filterValue) => {
              if (filterValue.length) {
                const rowValue = row.getValue(id);
                if (typeof rowValue === "object") {
                  return filterValue.includes(
                    `${rowValue.value} ${rowValue.id}`,
                  );
                }
                return filterValue.includes(String(rowValue));
              }
              return true;
            },
          });
        }
      }
    }
  }
  return result;
}

type SortDirection = "asc" | "desc" | false;

function getSortIcon(value: SortDirection, entityType: EntityTypes) {
  switch (value) {
    case "asc":
      return entityType === "measure" ? (
        <SortNAsc color="blue" />
      ) : (
        <SortAsc color="blue" />
      );
    case "desc":
      return entityType === "measure" ? (
        <SortNDesc color="blue" />
      ) : (
        <SortDesc color="blue" />
      );
    default:
      return <IconArrowsSort />;
  }
}

/** */
export function TableView<TData extends Record<string, any>>(
  props: {
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
  } & ViewProps<TData> &
    TableOptions<TData>,
) {
  const {
    cube,
    result,
    columnFilter = () => true,
    columnSorting = () => 0,
    ...mantineReactTableProps
  } = props;
  const {types} = result;

  const {locale, measures, drilldowns} = useSelector(selectCurrentQueryParams);

  const data = useMemo(
    () =>
      window.navigator.userAgent.includes("Firefox")
        ? result.data.slice(0, 10000)
        : result.data,
    [result.data],
  );

  const isLimited = result.data.length !== data.length;

  const {
    currentFormats,
    getAvailableKeys,
    getFormatter,
    getFormatterKey,
    setFormat,
  } = useFormatter(cube.measures);

  /**
   * This array contains a list of all the columns to be presented in the Table
   * Each item is an object containing useful information related to the column
   * and its contents, for later use.
   */
  const finalKeys = Object.values(types)
    .filter(t => !t.isId)
    .filter(columnFilter)
    .sort(columnSorting);
  const columns = useMemo((): ColumnDef<TData>[] => {
    return finalKeys.map(column => {
      const {
        entity,
        entityType,
        label: columnKey,
        localeLabel: header,
        valueType,
        range,
        isId,
      } = column;
      const isNumeric = valueType === "number";

      const formatterKey =
        getFormatterKey(columnKey) || (isNumeric ? "Decimal" : "identity");
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
      );

      return {
        ...filterOption,
        ...mantineFilterVariantObject,
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
            <Box mb={rem(10)}>
              <Flex justify="center" align="center">
                <Box sx={{flexGrow: 1}}>
                  <Flex gap={rem(10)}>
                    {getActionIcon(entityType)}
                    <Text size="md" color="black" fs={rem(16)}>
                      {column.columnDef.header}
                    </Text>
                    <ActionIcon
                      key={`sort-${column.columnDef.header}`}
                      size={22}
                      ml={rem(8)}
                      onClick={column.getToggleSortingHandler()}
                    >
                      {getSortIcon(column.getIsSorted(), entityType)}
                    </ActionIcon>
                  </Flex>
                  <Text ml={rem(35)} size="sm" color="dimmed" fw="normal">
                    {getEntityText(entityType)}
                  </Text>
                </Box>
                <ActionIcon
                  key={`visibility-${column.columnDef.header}`}
                  size={25}
                  ml={rem(8)}
                  onClick={() =>
                    column.toggleVisibility(!column.getIsVisible())
                  }
                >
                  <EyeSVG />
                </ActionIcon>
              </Flex>
            </Box>
          );
        },
        size: isId ? 80 : undefined,
        formatter,
        formatterKey,
        id: columnKey,
        dataType: valueType,
        accessorFn: item => {
          if (item[`${columnKey} ID`]) {
            return {value: item[columnKey], id: item[`${columnKey} ID`]};
          }
          return item[columnKey];
        },
        // not needed in headless implementation
        mantineTableHeadCellProps: {
          sx: theme => ({
            backgroundColor: getEntityColor(column.entityType, theme),
            align: isNumeric ? "right" : "left",
            height: 140,
            paddingBottom: 15,
            "& .mantine-TableHeadCell-Content": {
              justifyContent: "space-between",
              "& .mantine-Indicator-root": {
                display: "none",
              },
            },
          }),
        },
        Cell: isNumeric
          ? ({cell}) => formatter(cell.getValue())
          : ({renderedCellValue}) => {
              const value = hasProperty(renderedCellValue, "value")
                ? (renderedCellValue.value as string)
                : "";
              const id = hasProperty(renderedCellValue, "id")
                ? (renderedCellValue.id as string)
                : "";
              return (
                <Flex justify="space-between" sx={{width: "100%"}}>
                  <Box>{value}</Box>
                  <Text color="dimmed">{id}</Text>
                </Flex>
              );
            },
      } as any;
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
        // enablePagination: false,
        mantinePaginationProps: {
          // showRowsPerPage: false,
        },
        paginationDisplayMode: "pages",
        enableRowNumbers: true,
        rowNumberMode: "static",
        displayColumnDefOptions: {
          "mrt-row-numbers": {
            size: 10,
            maxSize: 25,
            enableOrdering: true,
          },
        },
        enableRowVirtualization: false,
        globalFilterFn: "contains",
        initialState: {
          density: "xs",
          showColumnFilters: true,
          pagination: {pageSize: 50},
        },
        mantineBottomToolbarProps: {
          id: "query-results-table-view-footer",
        },
        mantineTableProps: {
          sx: {
            "& td": {
              padding: "7px 10px!important",
            },
          },
          withColumnBorders: true,
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
              padding: 0,
            },
          }),
        },
        mantineTableContainerProps: {
          id: "query-results-table-view-table",
          h: {base: "auto", md: 0},
          sx: {
            flex: "1 1 auto",
          },
        },
        mantineTopToolbarProps: {
          id: "query-results-table-view-toolbar",
          sx: {
            flex: "0 0 auto",
          },
        },
        // renderColumnActionsMenuItems({column}) {
        //   if (!column?.columnDef?.isNumeric) return null;
        //   return (
        //     <Box>
        //       <Menu.Label>{t("table_view.numeral_format")}</Menu.Label>
        //       {column?.columnDef?.isNumeric &&
        //         getAvailableKeys(column?.columnDef?.accessorKey).map(key => (
        //           <Menu.Item
        //             key={key}
        //             icon={
        //               column?.columnDef?.formatterKey === key ? <IconCircleCheck /> : <IconCircle />
        //             }
        //             onClick={() => setFormat(column?.columnDef?.accessorKey, key)}
        //           >
        //             {getFormatter(key)(12345.678)}
        //           </Menu.Item>
        //         ))}
        //       <Menu.Divider />
        //     </Box>
        //   );
        // },
        rowVirtualizerProps: {
          measureElement() {
            return 37;
          },
        },
      }) as const,
    [isLimited],
  );

  function getColumn(id: string) {
    return finalKeys.find(c => c.label === id);
  }

  const table = useMantineReactTable({
    ...constTableProps,
    ...mantineReactTableProps,
    columns,
    data,
  } as TableOptions<TData>);

  return (
    <Stack
      align="stretch"
      sx={{
        height: "100%",
        maxHeight: "100vh",
        overflow: "scroll",
        position: "relative",
      }}
    >
      <Flex id="table-top-toolbar" direction="row" justify="space-between">
        <ModeTabs />
        <MRT_GlobalFilterTextInput table={table} />
        <MRT_ToolbarInternalButtons table={table} />
      </Flex>

      <Flex id="table-content" direction="row">
        <Flex direction="column" sx={{flex: "1 1 auto"}}>
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
                // display: "table-row-group",
                position: "relative",
                opacity: 0.97,
                top: 0,
              }}
            >
              {table.getHeaderGroups().map((headerGroup, idx, groups) => (
                <Box
                  component="tr"
                  key={`headers-${headerGroup.id}`}
                  sx={theme => ({
                    height: 140,
                    paddingBottom: 15,
                  })}
                >
                  {headerGroup.headers.map(header => {
                    const column = getColumn(header.id);
                    if (column) {
                      const isNumeric = column.valueType === "number";
                      return (
                        <Box
                          component="th"
                          key={header.id}
                          sx={theme => ({
                            backgroundColor: getEntityColor(
                              column.entityType,
                              theme,
                            ),
                            align: isNumeric ? "right" : "left",
                            height: 140,
                            paddingBottom: 15,
                            width: 350,
                            position: "sticky",
                            top: 0,
                            display: "table-cell",
                          })}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.Header ??
                                  header.column.columnDef.header,
                                header.getContext(),
                              )}
                          <MRT_TableHeadCellFilterContainer
                            header={header}
                            table={table}
                          />
                        </Box>
                      );
                    }

                    return (
                      <Fragment key={header.id}>
                        {/* <MRT_TableHeadCell header={header} table={table} /> */}
                        <Box
                          component="th"
                          sx={theme => ({
                            width: 100,
                            maxWidth: 140,
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            display: "table-cell",
                          })}
                        >
                          <Box>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.Header ??
                                    header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </Box>
                        </Box>
                      </Fragment>
                    );
                  })}
                </Box>
              ))}
            </Box>
            <Box component="tbody">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <MRT_TableBodyCell<TData>
                      key={cell.id}
                      cell={cell}
                      rowIndex={row.index}
                      rowRef={undefined as any}
                      table={table}
                    />
                  ))}
                </tr>
              ))}
            </Box>
          </Table>
          <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
        </Flex>
        <Box px="xl" py={"sm"} sx={{alignSelf: "self-start"}}>
          <OptionsMenu>
            <PlusSVG />
          </OptionsMenu>
        </Box>
      </Flex>

      <Flex id="table-bottom-toolbar" direction="row" justify="flex-end">
        <MRT_TablePagination table={table} />
      </Flex>
    </Stack>
  );
}

TableView.displayName = "TesseractExplorer:TableView";
