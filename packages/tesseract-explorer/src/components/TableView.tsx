import { ActionIcon, Alert, Box, MantineTheme, Menu, Flex, Text, rem, Group, MultiSelect } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import {
  MRT_ColumnDef as ColumnDef,
  MantineReactTable,
  MRT_TableOptions as TableOptions,
  useMantineReactTable
} from "mantine-react-table";
import React, { useMemo, useState } from "react";
import { useFormatter } from "../hooks/formatter";
import { useTranslation } from "../hooks/translation";
import { AnyResultColumn } from "../utils/structs";
import { ViewProps } from "../utils/types";
import { BarsSVG, StackSVG } from "./icons";
import { selectCurrentQueryParams, selectDrilldownItems, selectDrilldownMap } from "../state/queries";
import { useSelector } from "react-redux";
import { PlainLevel, PlainMeasure, PlainProperty } from "@datawheel/olap-client";
import { DrilldownItem } from "../utils/structs";


type EntityTypes = "measure" | "level" | "property";

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


function getMantineFilterMultiSelectProps(isId: Boolean, isNumeric: Boolean, range, entity: PlainLevel | PlainMeasure | PlainProperty, drilldowns: Record<string, DrilldownItem>) {
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
        const data = drilldowns[entity.fullName];
        if (data) {
          result = Object.assign({}, result, {
            mantineFilterMultiSelectProps: {
              data: data.members.map(o => o.caption),
            },
            filterFn: (row, id, filterValue) => {
              if (filterValue.length) {
                return filterValue.includes(String(row.getValue(id)))
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
  const a = useSelector(selectDrilldownItems)
  const b = useSelector(selectDrilldownMap)


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
  const columns = useMemo<ColumnDef<TData>[]>(() => {
    const finalKeys = Object.values(types).filter(columnFilter).sort(columnSorting);
    return finalKeys.map(column => {
      const { entity, entityType, label: columnKey, localeLabel: header, valueType, range, isId } = column;
      const isNumeric = valueType === "number";

      const formatterKey = getFormatterKey(columnKey) || (isNumeric ? "Decimal" : "identity");
      const formatter = getFormatter(formatterKey);
      const filterOption = getColumnFilterOption(entityType);

      const mantineFilterVariantObject = getMantineFilterMultiSelectProps(isId, isNumeric, range, entity, drilldowns);

      return {
        ...filterOption,
        ...mantineFilterVariantObject,
        header,
        Header: ({ column }) => {
          return (
            <div>
              <Flex gap={5}>
                {getActionIcon(entityType)}
                <Text size="md" color="black" fs={rem(16)}>
                  {column.columnDef.header}
                </Text>
              </Flex>
              <Text ml={rem(35)} size="sm" color="dimmed" fw="normal">
                {getEntityText(entityType)}
              </Text>
            </div>
          );
        },
        size: isId ? 80 : null,
        formatter,
        formatterKey,
        isNumeric,
        id: columnKey,
        dataType: valueType,
        accessorFn: item => item[columnKey],
        mantineTableHeadCellProps: {
          sx: theme => ({
            backgroundColor: getEntityColor(column.entityType, theme),
            align: isNumeric ? "right" : "left",
            height: 135,
            paddingBottom: 15
          })
        },
        Cell: isNumeric
          ? ({ cell }) => formatter(cell.getValue<number>())
          : ({ renderedCellValue }) => renderedCellValue
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
      enablePagination: false,
      enableRowNumbers: true,
      rowNumberMode: "static",
      displayColumnDefOptions: {
        "mrt-row-numbers": {
          size: 10,
          maxSize: 15,
          enableOrdering: true,
        }
      },
      enableRowVirtualization: true,
      globalFilterFn: "contains",
      initialState: { density: "xs", showColumnFilters: true },
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

  const table = useMantineReactTable({
    ...constTableProps,
    ...mantineReactTableProps,
    columns,
    data
  });

  return <MantineReactTable table={table} />;
}

TableView.displayName = "TesseractExplorer:TableView";
