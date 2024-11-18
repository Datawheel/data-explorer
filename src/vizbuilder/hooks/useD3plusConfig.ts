import type {TranslateFunction} from "@datawheel/use-translation";
import type {
  BarChart,
  Chart,
  ChoroplethMap,
  D3plusConfig,
  DonutChart,
  LinePlot,
  StackedArea,
  TreeMap,
} from "@datawheel/vizbuilder";
import {type Formatter, d3plusConfigBuilder} from "@datawheel/vizbuilder/react";
import type {TesseractMeasure} from "@datawheel/vizbuilder/schema";
import {assign} from "d3plus-common";
import {
  BarChart as BarChartComponent,
  Geomap as ChoroplethComponent,
  Donut as DonutComponent,
  LinePlot as LinePlotComponent,
  StackedArea as StackedAreaComponent,
  Treemap as TreeMapComponent,
} from "d3plus-react";
import {useMemo} from "react";
import {useFormatter} from "../../hooks/formatter";

interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  t: TranslateFunction;
}

const buildCommon = d3plusConfigBuilder.common;
const buildBarchart = d3plusConfigBuilder.barchart;
const buildChoropleth = d3plusConfigBuilder.choropleth;
const buildDonut = d3plusConfigBuilder.donut;
const buildLineplot = d3plusConfigBuilder.lineplot;
const buildStackedarea = d3plusConfigBuilder.stackedarea;
const buildTreemap = d3plusConfigBuilder.treemap;

d3plusConfigBuilder.common = (chart: Chart, params: ChartBuilderParams) => {
  const config = buildCommon(chart, params);
  return config;
};

export function useD3plusConfig(
  chart: Chart | undefined,
  params: Omit<ChartBuilderParams, "getFormatter">,
) {
  const {fullMode, getMeasureConfig, showConfidenceInt, t} = params;
  const {getFormatter} = useFormatter();

  return useMemo(() => {
    if (!chart) return [null, {data: [], locale: ""}];

    const params: ChartBuilderParams = {
      fullMode,
      getFormatter,
      getMeasureConfig,
      showConfidenceInt,
      t: (template, data) => t(`vizbuilder.${template}`, data),
    };

    if (chart.type === "barchart") {
      return [BarChartComponent, buildBarchartConfig(chart, params)];
    }
    if (chart.type === "choropleth") {
      const config = buildChoroplethConfig(chart, params);
      if (chart.extraConfig.d3plus) assign(config, chart.extraConfig.d3plus);
      return [ChoroplethComponent, config];
    }
    if (chart.type === "donut") {
      return [DonutComponent, buildDonutConfig(chart, params)];
    }
    if (chart.type === "lineplot") {
      return [LinePlotComponent, buildLineplotConfig(chart, params)];
    }
    if (chart.type === "stackedarea") {
      return [StackedAreaComponent, buildStackedareaConfig(chart, params)];
    }
    if (chart.type === "treemap") {
      return [TreeMapComponent, buildTreemapConfig(chart, params)];
    }
    return [null, {data: [], locale: ""}];
  }, [chart, fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t]);
}

function buildBarchartConfig(chart: BarChart, params: ChartBuilderParams) {
  const config = buildBarchart(chart, params);
  return config;
}

function buildChoroplethConfig(chart: ChoroplethMap, params: ChartBuilderParams) {
  const config = buildChoropleth(chart, params);
  return config;
}

function buildDonutConfig(chart: DonutChart, params: ChartBuilderParams) {
  const config = buildDonut(chart, params);
  return config;
}

function buildLineplotConfig(chart: LinePlot, params: ChartBuilderParams) {
  const config = buildLineplot(chart, params);
  return config;
}

function buildStackedareaConfig(chart: StackedArea, params: ChartBuilderParams) {
  const config = buildStackedarea(chart, params);
  return config;
}

function buildTreemapConfig(chart: TreeMap, params: ChartBuilderParams) {
  const config = buildTreemap(chart, params);
  return config;
}
