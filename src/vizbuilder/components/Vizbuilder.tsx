import {
  type Chart,
  type ChartLimits,
  type ChartType,
  type D3plusConfig,
  type Dataset,
  generateCharts
} from "@datawheel/vizbuilder";
import {createStyles, Modal} from "@mantine/core";
import cls from "clsx";
import React, {useCallback, useMemo} from "react";
import type {TesseractLevel, TesseractMeasure} from "../../api/tesseract/schema";
import {asArray as castArray} from "../../utils/array";
import {ChartCard} from "./ChartCard";
import {ErrorBoundary} from "./ErrorBoundary";
import {NonIdealState} from "./NonIdealState";
import {useSelector} from "react-redux";
import {selectCurrentQueryItem} from "../../state/queries";
import {useSettings} from "../../hooks/settings";

export type VizbuilderProps = React.ComponentProps<typeof Vizbuilder>;

/** */
export function Vizbuilder(props: {
  /**
   * The datasets to extract the charts from.
   */
  datasets: Dataset | Dataset[];

  /**
   * Defines a set of rules about the validity/usefulness of the generated charts.
   * Charts which not comply with them are discarded.
   *
   * @see {@link ChartLimits} for details on its properties.
   */
  chartLimits?: Partial<ChartLimits>;

  /**
   * A list of the chart types the algorithm will generate.
   *
   * @default ["barchart", "choropleth", "donut", "lineplot", "stackedarea", "treemap"]
   */
  chartTypes?: ChartType[];

  /**
   * Custom className to apply to the component wrapper.
   *
   * @default
   */
  className?: string;

  /**
   * A ReactNode to render above the main charts area.
   *
   * @default undefined
   */
  customHeader?: React.ReactNode;

  /**
   * A ReactNode to render under the main charts area.
   *
   * @default undefined
   */
  customFooter?: React.ReactNode;

  /**
   * Defines a maximum amount of records to consider when analyzing the data.
   *
   * @default 20000
   */
  datacap?: number;

  /**
   * A list of extension formats to make available to download charts as.
   *
   * @default ["SVG", "PNG"]
   */
  downloadFormats?: readonly ("PNG" | "SVG" | "JPG")[];

  /**
   * Custom d3plus configuration to apply when a chart value references a
   * specified measures.
   */
  measureConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((measure: TesseractMeasure) => Partial<D3plusConfig>);

  /**
   * A component to show in case no valid/useful charts can be generated from the datasets.
   */
  nonIdealState?: React.ComponentType<{status: string}>;

  /**
   * Determines if the charts will use associated measures to show confidence
   * intervals or margins of error.
   *
   * @default false
   */
  showConfidenceInt?: boolean;

  /**
   * Custom d3plus configuration to apply when a chart series references a
   * specified Geographic dimension level.
   * Use this to provide the [`topojson`](https://d3plus.org/?path=/docs/charts-choropleth-map--documentation) field to these charts, otherwise they
   * will be discarded.
   */
  topojsonConfig?:
    | {[K: string]: Partial<D3plusConfig>}
    | ((level: TesseractLevel) => Partial<D3plusConfig>);

  /**
   * Custom d3plus configuration to apply to all generated charts.
   * Unlike measureConfig and topojsonConfig, this is applied after all other
   * chart configs have been resolved, so is able to overwrite everything.
   */
  userConfig?: (chart: Chart) => Partial<D3plusConfig>;
}) {
  const {
    datasets,
    chartLimits,
    chartTypes,
    datacap,
    downloadFormats,
    measureConfig,
    nonIdealState,
    showConfidenceInt,
    topojsonConfig,
    userConfig
  } = props;

  const queryItem = useSelector(selectCurrentQueryItem);
  const currentChart = queryItem?.chart || "";
  const {actions} = useSettings();

  const useStyles = createStyles(theme => ({
    grid: {
      padding: theme.spacing.md,
      display: "grid",
      gridTemplateColumns: "1fr",
      gridAutoRows: "minmax(200px, auto)",
      gap: theme.spacing.md,
      rowGap: theme.spacing.md,

      [theme.fn.largerThan("md")]: {
        gridTemplateColumns: "1fr 1fr",
        rowGap: theme.spacing.xl
      }
    },
    itemLarge: {
      gridRow: "auto",
      gridColumn: "auto",
      [theme.fn.largerThan("md")]: {
        gridRow: "span 2"
      }
    },
    itemSmallTop: {
      gridRow: "auto",
      gridColumn: "auto",
      [theme.fn.largerThan("md")]: {
        // gridRow: 1,
        // gridColumn: 2
      }
    },
    itemSmallBottom: {
      gridRow: "auto",
      gridColumn: "auto",
      [theme.fn.largerThan("md")]: {
        // gridRow: 2,
        // gridColumn: 2
      }
    },
    // for single chart
    fill: {
      gridColumn: "1",
      gridRow: "1",
      height: "100%",
      width: "100%",
      [theme.fn.largerThan("md")]: {
        gridColumn: "1 / span 2",
        gridRow: "1 / span 2"
      }
    }
  }));

  const {classes, cx} = useStyles();

  const setCurrentChart = useCallback(
    (chart: string) => {
      actions.updateChart(chart);
    },
    [actions]
  );

  // Normalize measureConfig to function type
  const getMeasureConfig = useMemo(() => {
    const config = measureConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [measureConfig]);

  // Normalize topojsonConfig to function type
  const getTopojsonConfig = useMemo(() => {
    const config = topojsonConfig || {};
    return typeof config === "function" ? config : item => config[item.name];
  }, [topojsonConfig]);

  // Compute possible charts
  const charts = useMemo(() => {
    const charts = generateCharts(castArray(datasets), {
      chartLimits: chartLimits as ChartLimits | undefined,
      chartTypes,
      datacap,
      getTopojsonConfig
    });
    return Object.fromEntries(charts.map(chart => [chart.key, chart]));
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  const content = useMemo(() => {
    const Notice = nonIdealState || NonIdealState;

    const isLoading = castArray(datasets).some(
      dataset => Object.keys(dataset.columns).length === 0
    );
    if (isLoading) {
      console.debug("Loading datasets...", datasets);
      return <Notice status="loading" />;
    }

    let chartList = Object.values(charts);

    if (chartList.length === 0 && !Array.isArray(datasets) && datasets.data.length === 1)
      return <Notice status="one-row" />;
    if (chartList.length === 0) return <Notice status="empty" />;

    const isSingleChart = chartList.length === 1;

    // Limit the number of charts to 10. Short term fix for performance issues, foreing trade.
    if (chartList.length > 10) {
      chartList = chartList.slice(0, 10);
    }

    return (
      <ErrorBoundary>
        <div className={cx(classes.grid, {[classes.fill]: isSingleChart})}>
          {chartList.map((chart, idx) => {
            // For each group of 3 charts, assign grid positions
            const pos = idx % 3;
            let style = {};
            let className = "";
            let height;
            if (isSingleChart) {
              className = classes.fill;
              height = 600;
            } else {
              if (pos === 0) {
                className = classes.itemLarge;
                height = 800;
              } else if (pos === 1) {
                className = classes.itemSmallTop;
              } else if (pos === 2) {
                className = classes.itemSmallBottom;
              }
            }
            return (
              <div key={chart.key} className={className} style={style}>
                <ChartCard
                  chart={chart}
                  downloadFormats={downloadFormats as string[] | undefined}
                  measureConfig={getMeasureConfig}
                  onFocus={() => setCurrentChart(chart.key)}
                  showConfidenceInt={showConfidenceInt}
                  userConfig={userConfig}
                  {...(height ? {height} : {})}
                />
              </div>
            );
          })}
        </div>
      </ErrorBoundary>
    );
  }, [
    charts,
    datasets,
    downloadFormats,
    getMeasureConfig,
    nonIdealState,
    showConfidenceInt,
    userConfig,
    classes,
    cx
  ]);

  const focusContent = useMemo(() => {
    const chart = charts[currentChart];

    if (!chart) return null;

    return (
      <ChartCard
        key={`${chart.key}-focus`}
        chart={chart}
        downloadFormats={downloadFormats as string[] | undefined}
        measureConfig={getMeasureConfig}
        onFocus={() => setCurrentChart("")}
        showConfidenceInt={showConfidenceInt}
        userConfig={userConfig}
        isFullMode
      />
    );
  }, [charts, currentChart, downloadFormats, getMeasureConfig, showConfidenceInt, userConfig]);

  return (
    <div style={{height: "100%"}} className={cls("vb-wrapper", props.className)}>
      {props.customHeader}
      {content}
      {props.customFooter}

      <Modal
        centered
        onClose={useCallback(() => setCurrentChart(""), [])}
        opened={currentChart !== ""}
        padding={0}
        size="calc(100vw - 3rem)"
        styles={{
          content: {maxHeight: "none !important"},
          inner: {padding: "0 !important"}
        }}
        withCloseButton={false}
      >
        {focusContent}
      </Modal>
    </div>
  );
}
