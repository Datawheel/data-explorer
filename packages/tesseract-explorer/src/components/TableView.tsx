import {
  ActionIcon, Alert, Box, MantineTheme, Flex, Text,
  rem, Stack, Divider, Table
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  MRT_ColumnDef as ColumnDef,
  MantineReactTable,
  MRT_TableOptions as TableOptions,
  useMantineReactTable,
  flexRender,
  MRT_GlobalFilterTextInput,
  MRT_TablePagination,
  MRT_ToolbarAlertBanner,
  MRT_ColumnActionMenu,
  MRT_TableHeadCellFilterContainer,
  MRT_BottomToolbar,
  MRT_TableBodyCell,
  MRT_TopToolbar,
  MRT_TableHeadCell
} from "mantine-react-table";
import React, { useMemo, useState } from "react";
import { useFormatter } from "../hooks/formatter";
import { useTranslation } from "../hooks/translation";
import { AnyResultColumn } from "../utils/structs";
import { ViewProps } from "../utils/types";
import { BarsSVG, StackSVG, EyeSVG, SortSVG } from "./icons";
import { selectCurrentQueryParams } from "../state/queries";
import { useSelector } from "react-redux";
import { PlainLevel, PlainMeasure, PlainProperty } from "@datawheel/olap-client";
import { DrilldownItem } from "../utils/structs";
import { isNumeric } from "../utils/validation";

type EntityTypes = "measure" | "level" | "property";
type TData = Record<string, string | number>


const getEntityColor = (entityType: EntityTypes, theme: MantineTheme) => {
  if (entityType === "measure") {
    return theme.fn.lighten(theme.colors.red[8], 0.9);
  } else if (entityType === "level") {
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
      return { columnFilterModeOptions: ["between", "greaterThan", "lessThan"] };
    case "level":
      return { columnFilterModeOptions: true };
    default:
      return { columnFilterModeOptions: true };
  }
};

function getMemberFilterFn(data, key: string) {
  const dd = data[0]
  if (dd[key + " " + "ID"]) {
    return (member) => `${member.caption} ${member.key}`;
  }
  return (member) => member.caption;
}


function getMantineFilterMultiSelectProps(isId: Boolean, isNumeric: Boolean, range, entity: PlainLevel | PlainMeasure | PlainProperty, drilldowns: Record<string, DrilldownItem>, data: TData[], columnKey: string) {
  let result: {
    filterVariant?: "multi-select" | "text",
    mantineFilterMultiSelectProps?: { data: unknown },
  } = {}

  // const filterVariant = !isId && isNumeric && range && (range[1] - range[0] <= 50) ? "multi-select" : "text"
  const filterVariant = !isId && (!range || range && (range[1] - range[0] <= 50)) ? "multi-select" : "text"
  result = Object.assign({}, result, { filterVariant })

  if (result.filterVariant === "multi-select") {
    if (entity._type === "level") {
      if (entity.fullName) {
        const dd = Object.keys(drilldowns).reduce((prev, key) => ({ ...prev, [drilldowns[key].fullName]: drilldowns[key] }), {})
        const drilldwonData = dd[entity.fullName];

        if (drilldwonData) {
          const getmemberFilterValue = getMemberFilterFn(data, columnKey)
          result = Object.assign({}, result, {
            mantineFilterMultiSelectProps: {
              data: drilldwonData.members.map(getmemberFilterValue),
            },
            filterFn: (row, id, filterValue) => {
              if (filterValue.length) {
                const rowValue = row.getValue(id)
                if (typeof rowValue === "object") {
                  return filterValue.includes(String(rowValue.value + " " + rowValue.id))
                }
                return filterValue.includes(String(rowValue))
              }
              return true
            },

          })
        }

      }
    }
  }
  return result
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
    TableOptions<TData>
) {
  const {
    cube,
    result,
    columnFilter = () => true,
    columnSorting = () => 0,
    ...mantineReactTableProps
  } = props;
  const { types } = result;

  const { locale, measures, drilldowns } = useSelector(selectCurrentQueryParams);

  const data = useMemo(
    () =>
      window.navigator.userAgent.includes("Firefox") ? result.data.slice(0, 10000) : result.data,
    [result.data]
  );

  const isLimited = result.data.length !== data.length;

  const { translate: t } = useTranslation();

  const { currentFormats, getAvailableKeys, getFormatter, getFormatterKey, setFormat } = useFormatter(
    cube.measures
  );

  /**
   * This array contains a list of all the columns to be presented in the Table
   * Each item is an object containing useful information related to the column
   * and its contents, for later use.
   */
  const finalKeys = Object.values(types).filter(t => !t.isId).filter(columnFilter).sort(columnSorting);
  const columns = useMemo<ColumnDef<TData>[]>(() => {

    return finalKeys.map(column => {
      const { entity, entityType, label: columnKey, localeLabel: header, valueType, range, isId } = column;
      const isNumeric = valueType === "number";

      const formatterKey = getFormatterKey(columnKey) || (isNumeric ? "Decimal" : "identity");
      const formatter = getFormatter(formatterKey);
      const filterOption = getColumnFilterOption(entityType);
      const mantineFilterVariantObject = getMantineFilterMultiSelectProps(isId, isNumeric, range, entity, drilldowns, data, columnKey);

      return {
        ...filterOption,
        ...mantineFilterVariantObject,
        header,
        enableHiding: true,
        Header: ({ column }) => {
          return (
            <Box mb={rem(10)}>
              <Flex justify="center" align="center">
                <Box sx={{ flexGrow: 1 }}>
                  <Flex gap={rem(10)}>
                    {getActionIcon(entityType)}
                    <Text size="md" color="black" fs={rem(16)}>
                      {column.columnDef.header}
                    </Text>
                    <ActionIcon key={`sort-${column.columnDef.header}`} size={22} ml={rem(8)} onClick={() => column.toggleSorting()}>
                      <SortSVG />
                    </ActionIcon>
                  </Flex>
                  <Text ml={rem(35)} size="sm" color="dimmed" fw="normal">
                    {getEntityText(entityType)}
                  </Text>
                </Box>
                <ActionIcon key={`visibility-${column.columnDef.header}`} size={25} ml={rem(8)} onClick={() => column.toggleVisibility(!column.getIsVisible())}>
                  <EyeSVG />
                </ActionIcon>
              </Flex>

            </Box >
          );
        },
        size: isId ? 80 : null,
        formatter,
        formatterKey,
        id: columnKey,
        dataType: valueType,
        accessorFn: item => {
          if (item[columnKey + " " + 'ID']) {
            return { value: item[columnKey], id: item[columnKey + " " + 'ID'] }
          }
          return item[columnKey]
        },
        // not needed in headless implementation
        mantineTableHeadCellProps: {
          sx: theme => ({
            backgroundColor: getEntityColor(column.entityType, theme),
            align: isNumeric ? "right" : "left",
            height: 140,
            paddingBottom: 15,
            '& .mantine-TableHeadCell-Content': {
              justifyContent: 'space-between',
              '& .mantine-Indicator-root': {
                display: 'none'
              }
            },
          })
        },
        Cell: isNumeric
          ? ({ cell }) => formatter(cell.getValue<number>())
          : ({ renderedCellValue }) => {
            if (renderedCellValue && typeof renderedCellValue === 'object') {
              return (<Flex justify="space-between" sx={{ width: "100%" }}>
                <Box>{renderedCellValue.value}</Box>
                <Box><Text color="dimmed">{renderedCellValue.id}</Text></Box>
              </Flex>);
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
      // enablePagination: false,
      mantinePaginationProps: {
        showRowsPerPage: false,
      },
      paginationDisplayMode: 'pages',
      enableRowNumbers: true,
      rowNumberMode: "static",
      displayColumnDefOptions: {
        "mrt-row-numbers": {
          size: 10,
          maxSize: 25,
          enableOrdering: true,
        }
      },
      enableRowVirtualization: false,
      globalFilterFn: "contains",
      initialState: { density: "xs", showColumnFilters: true, pagination: { pageSize: 50 } },
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
        h: { base: "auto", md: 0 },
        sx: {
          flex: "1 1 auto"
        }
      },
      mantineTopToolbarProps: {
        id: "query-results-table-view-toolbar",
        sx: {
          flex: "0 0 auto"
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
        }
      }
    } as const),
    [isLimited]
  );


  function getColumn(id: String) {
    return finalKeys.find(c => c.label === id)
  }

  const table = useMantineReactTable({
    ...constTableProps,
    ...mantineReactTableProps,
    columns,
    data,
  });

  return (

    <Stack sx={{ height: "100%", maxHeight: '100vh', overflow: "scroll", position: "relative" }}>
      <MRT_TopToolbar table={table} />
      <Flex direction="column">
        <Flex justify="space-between" align="center">
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
            {/* Use your own markup, customize however you want using the power of TanStack Table */}
            <Box component="thead" sx={{
              // display: "table-row-group",
              position: "relative",
              opacity: 0.97,
              top: 0
            }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <Box component="tr" key={headerGroup.id} sx={theme => ({
                  height: 140,
                  paddingBottom: 15,
                })
                }>
                  {headerGroup.headers.map((header) => {
                    const column = getColumn(header.id)
                    if (column) {
                      const isNumeric = column.valueType === "number"
                      return (
                        <Box component="th" key={header.id} sx={theme => ({
                          backgroundColor: getEntityColor(column.entityType, theme),
                          align: isNumeric ? "right" : "left",
                          height: 140,
                          paddingBottom: 15,
                          width: 350,
                          position: "sticky",
                          top: 0,
                          display: "table-cell"

                        })
                        }>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.Header ??
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          <MRT_TableHeadCellFilterContainer header={header} table={table} />
                        </Box>
                      )
                    } else {
                      return (<>
                        {/* <MRT_TableHeadCell header={header} table={table} /> */}
                        <Box component="th" key={header.id} sx={theme => ({
                          width: 100,
                          maxWidth: 140,
                          position: "sticky",
                          top: 0,
                          backgroundColor: "white",
                          display: "table-cell"
                        })}>
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
                      </>
                      )
                    }
                  })}
                </Box>
              ))}
            </Box>
            <Box component="tbody">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {
                    row.getVisibleCells().map((cell) =>
                      <MRT_TableBodyCell key={cell.id} cell={cell} rowIndex={row.index} table={table} />
                    )
                  }
                </tr>
              ))}
            </Box>
          </Table>
          <MRT_ToolbarAlertBanner stackAlertBanner table={table} />
        </Flex>
        <Box sx={{ alignSelf: "end" }}>
          <MRT_TablePagination table={table} />
        </Box>
      </Flex>
    </Stack>
  )

}




TableView.displayName = "TesseractExplorer:TableView";