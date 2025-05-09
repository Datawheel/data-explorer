import {Alert, Box, Button, Input, Loader, SimpleGrid, createStyles} from "@mantine/core";
import {IconAlertCircle, IconAlertTriangle} from "@tabler/icons-react";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_TableOptions as TableOptions
} from "mantine-react-table";
import React, {forwardRef, useMemo, useState} from "react";
import {Aggregator} from "../api";
import {mapDimensionHierarchyLevels} from "../api/traverse";
import {useFormatParams, usePivottedData} from "../hooks/pivot";
import {useTranslation} from "../hooks/translation";
import {filterMap} from "../utils/array";
import {getCaption} from "../utils/string";
import {keyBy} from "../utils/transform";
import type {Formatter, JSONArrays, ViewProps} from "../utils/types";
import {isActiveItem} from "../utils/validation";
import {ButtonDownload} from "./ButtonDownload";
import {NonIdealState} from "./NonIdealState";
import {SelectObject} from "./Select";
import type {SelectObjectProps} from "./Select";
import {useServerSchema} from "../hooks/useQueryApi";

type DrilldownType = "geo" | "standard" | "time" | "prop";
type VoidFunction = (...args) => void;

type SelectOptionType = {
  label: string;
  value: string;
  type: string;
};

const SelectOption = forwardRef<HTMLSelectElement, SelectObjectProps<SelectOptionType>>(
  (props, ref) => {
    return <SelectObject ref={ref} {...props} />;
  }
);

const useStyles = createStyles(theme => ({
  container: {
    [theme.fn.largerThan("md")]: {
      height: "100%",
      display: "flex",
      flexFlow: "row nowrap"
    }
  },

  colParams: {
    [theme.fn.largerThan("md")]: {
      flex: "0 0 280px"
    }
  },

  colContent: {
    [theme.fn.largerThan("md")]: {
      width: 0,
      flex: "1 1 auto"
    }
  }
}));

/** */
export function PivotViewTable<TData extends Record<string, unknown>>(
  props: {} & ViewProps<TData> & TableOptions<TData>
) {
  const {cube, params, className, panelKey, data: result, ...mantineReactTableProps} = props;
  const {translate: t} = useTranslation();
  const {data: schema} = useServerSchema();
  const {classes, cx} = useStyles();
  const locale = params.locale;
  const measures = schema?.cubeMap[cube.name]?.measures || [];

  const measureMap = Object.fromEntries(measures.map(item => [item.name, item]));
  const measureOptions = filterMap(Object.values(params.measures), item => {
    const entity = measureMap[item.name];
    return !isActiveItem(item)
      ? null
      : {
          value: item.name,
          label: getCaption(entity, locale),
          type: entity.aggregator
        };
  });

  const levelMap = mapDimensionHierarchyLevels(cube);
  const drilldownOptions = Object.values(params.drilldowns)
    .filter(isActiveItem)
    .flatMap(item => {
      const [level, hierarchy, dimension] = levelMap[item.level];
      const caption = getCaption(level, locale);
      const type = dimension.type as DrilldownType;
      const propertyMap = keyBy(level.properties, "name");

      const levelOptions = [{value: item.level, label: caption, type}];
      if (result.length && `${item.level} ID` in result[0]) {
        levelOptions.push({value: `${item.level} ID`, label: `${caption} ID`, type});
      }
      return levelOptions.concat(
        filterMap(item.properties, item => {
          const entity = propertyMap[item.name];
          return !isActiveItem(item)
            ? null
            : {
                value: item.name,
                label: `${caption} › ${getCaption(entity, locale)}`,
                type: "prop"
              };
        })
      );
    });

  const [colProp, setColumnProp] = useState(
    () => drilldownOptions.find(item => item.type === "time") || drilldownOptions[0]
  );
  const [rowProp, setRowProp] = useState(
    () => drilldownOptions.find(item => item !== colProp) || drilldownOptions[0]
  );
  const [valProp, setValueProp] = useState(() => measureOptions[0]);

  const fileName = [params.cube, colProp.label, rowProp.label, valProp.value].join("_");

  const [pivottedData, pivottingError, isProcessing] = usePivottedData(
    result,
    colProp.value,
    rowProp.value,
    valProp.value
  );

  const {formatter, formatterKey, formatterKeyOptions, setFormat} = useFormatParams(
    props.cube.measures,
    valProp.value
  );

  const warnings = useMemo(() => {
    const warnings: React.ReactNode[] = [];
    if (rowProp.type === "prop" || colProp.type === "prop") {
      warnings.push(
        <Alert color="yellow" m="sm" icon={<IconAlertCircle size="2rem" />} key="propertypivot">
          {t("pivot_view.warning_propertypivot")}
        </Alert>
      );
    }
    const drilldownCount = Object.values(params.drilldowns).filter(isActiveItem).length;
    if (drilldownCount > 2) {
      warnings.push(
        valProp.type !== Aggregator.SUM ? (
          <Alert color="yellow" m="sm" icon={<IconAlertCircle size="2rem" />} key="notsummeasure">
            {t("pivot_view.warning_notsummeasure")}
          </Alert>
        ) : (
          <Alert color="yellow" m="sm" icon={<IconAlertCircle size="2rem" />} key="sumdimensions">
            {t("pivot_view.warning_sumdimensions")}
          </Alert>
        )
      );
    }
    return warnings;
  }, [params.drilldowns, rowProp, colProp, valProp]);

  const downloadToolbar = useMemo(() => {
    if (!pivottedData) return null;

    return (
      <Input.Wrapper label={t("pivot_view.title_download")}>
        <Button.Group>
          <ButtonDownload
            provider={() => ({
              name: fileName,
              extension: "csv",
              content: stringifyMatrix(pivottedData, formatter, "csv")
            })}
          >
            CSV
          </ButtonDownload>
          <ButtonDownload
            provider={() => ({
              name: fileName,
              extension: "tsv",
              content: stringifyMatrix(pivottedData, formatter, "tsv")
            })}
          >
            TSV
          </ButtonDownload>
        </Button.Group>
      </Input.Wrapper>
    );
  }, [pivottedData, formatter]);

  if (drilldownOptions.length < 2) {
    return (
      <NonIdealState
        icon={<IconAlertTriangle color="orange" size="5rem" />}
        title={t("pivot_view.error_missingparams")}
      />
    );
  }

  let preview;

  if (!colProp || !rowProp || !valProp) {
    preview = (
      <NonIdealState
        icon={<IconAlertTriangle color="orange" size="5rem" />}
        title={t("pivot_view.error_missingparams")}
      />
    );
  } else if (colProp === rowProp) {
    preview = (
      <NonIdealState
        icon={<IconAlertTriangle color="orange" size="5rem" />}
        title={t("pivot_view.error_onedimension")}
      />
    );
  } else if (pivottingError != null) {
    preview = (
      <NonIdealState
        icon={<IconAlertTriangle color="orange" size="5rem" />}
        title={t("pivot_view.error_internal")}
        description={t("pivot_view.error_internal_detail", {error: pivottingError.message})}
      />
    );
  } else if (!pivottedData) {
    preview = (
      <NonIdealState
        icon={<Loader size="xl" />}
        title={t("pivot_view.loading_title")}
        description={t("pivot_view.loading_details")}
      />
    );
  } else {
    preview = (
      <MatrixTable
        key={`${fileName} ${formatterKey}`}
        data={pivottedData.data}
        headers={pivottedData.headers}
        formatter={formatter}
        tableProps={{...mantineReactTableProps, data: result}}
      />
    );
  }

  return (
    <Box id="query-results-pivot-view" className={cx(props.className, classes.container)}>
      <Box className={classes.colParams}>
        <SimpleGrid
          id="query-results-pivot-view-params"
          px="md"
          py="sm"
          cols={1}
          breakpoints={[
            {minWidth: "xs", cols: 2},
            {minWidth: "sm", cols: 3},
            {minWidth: "md", cols: 1}
          ]}
        >
          <SelectOption
            getLabel="label"
            getValue="value"
            items={drilldownOptions}
            onItemSelect={setColumnProp as VoidFunction}
            selectedItem={colProp.value}
            label={
              colProp.type === "prop"
                ? t("pivot_view.label_ddcolumnprop")
                : t("pivot_view.label_ddcolumn")
            }
          />

          <SelectOption
            getLabel="label"
            getValue="value"
            items={drilldownOptions}
            onItemSelect={setRowProp as VoidFunction}
            selectedItem={rowProp.value}
            label={
              rowProp.type === "prop"
                ? t("pivot_view.label_ddrowprop")
                : t("pivot_view.label_ddrow")
            }
          />

          <SelectOption
            getLabel="label"
            getValue="value"
            items={measureOptions}
            label={t("pivot_view.label_valmeasure")}
            onItemSelect={setValueProp as VoidFunction}
            selectedItem={valProp.value}
          />

          <SelectObject
            getLabel="label"
            getValue="value"
            items={formatterKeyOptions}
            label={t("pivot_view.label_formatter")}
            onItemSelect={item => setFormat(valProp.value, item.value)}
            selectedItem={formatterKey}
          />

          {downloadToolbar}
        </SimpleGrid>

        {warnings.length > 0 ? warnings : null}
      </Box>

      <Box className={classes.colContent}>{preview}</Box>
    </Box>
  );
}

/** */
function MatrixTable(
  props: JSONArrays & {
    formatter: Formatter;
    tableProps: TableOptions<any>;
  }
) {
  const {data, formatter, headers, ...mantineReactTableProps} = props;

  const columns = useMemo(
    () =>
      headers.map(
        (header, colIndex) =>
          ({
            accesorKey: header,
            Cell: ({row}) =>
              colIndex > 0 && typeof row.original[colIndex] === "number"
                ? formatter(row.original[colIndex])
                : row.original[colIndex],
            header,
            mantineTableBodyCellProps: {
              align: colIndex > 0 ? "right" : "left"
            }
          } as const)
      ),
    [headers, formatter]
  );

  const tableProps = useMemo(
    () =>
      ({
        enableBottomToolbar: false,
        enableColumnFilterModes: true,
        enableColumnResizing: true,
        enableColumnVirtualization: true,
        enableTopToolbar: false,
        enablePagination: false,
        enableRowNumbers: true,
        enableRowVirtualization: true,
        initialState: {
          density: "xs"
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
          id: "query-results-pivot-view-preview",
          withBorder: false,
          sx: theme => ({
            height: "100%",
            padding: `0 ${theme.spacing.sm}`,
            [theme.fn.largerThan("lg")]: {
              padding: 0
            }
          })
        },
        mantineTableContainerProps: {
          id: "query-results-pivot-view-table",
          sx: {
            height: "100%"
          }
        },
        rowVirtualizerProps: {
          measureElement() {
            return 37;
          }
        }
      } as const),
    []
  );

  const table = useMantineReactTable({
    ...tableProps,
    ...mantineReactTableProps,
    columns,
    data
  });

  return <MantineReactTable table={table} />;
}

/**
 * Outputs a CSV-like string.
 */
function stringifyMatrix(matrix: JSONArrays, formatter: Formatter, format: "csv" | "tsv") {
  const joint = {csv: ",", tsv: "\t"}[format];
  const safeQuoter = value => {
    const str = `${value}`.trim();
    return str.includes(joint) ? JSON.stringify(str) : str;
  };
  const safeFormatter = value => (value === undefined ? "" : safeQuoter(formatter(value)));

  return [
    matrix.headers.map(safeQuoter).join(joint),
    ...matrix.data.map(row => [safeQuoter(row[0]), ...row.slice(1).map(safeFormatter)].join(joint))
  ].join("\n");
}
