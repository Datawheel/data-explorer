import type {TranslateFunction} from "@datawheel/use-translation";
import type {
  BarChart,
  Chart,
  ChoroplethMap,
  Column,
  D3plusConfig,
  DonutChart,
  LinePlot,
  StackedArea,
  TreeMap,
} from "@datawheel/vizbuilder";
import {
  BarChart as BarChartComponent,
  Geomap as ChoroplethComponent,
  Donut as DonutComponent,
  LinePlot as LinePlotComponent,
  StackedArea as StackedAreaComponent,
  Treemap as TreeMapComponent,
} from "d3plus-react";
import {assign} from "lodash-es";
import {useMemo} from "react";
import type {TesseractMeasure} from "../../api/tesseract/schema";
import {useFormatter} from "../../hooks/formatter";
import {filterMap, getLast} from "../../utils/array";
import type {Formatter} from "../../utils/types";
import {isOneOf} from "../../utils/validation";
import {getColumnEntity} from "../tooling/columns";

type DataPoint = Record<string, unknown>;

interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  t: TranslateFunction;
}

export function useD3plusConfig(
  chart: Chart | undefined,
  params: Omit<ChartBuilderParams, "getFormatter">,
) {
  const {fullMode, getMeasureConfig, showConfidenceInt, t} = params;

  const {getFormatter} = useFormatter();

  return useMemo((): [
    React.ComponentType<{config: D3plusConfig}> | null,
    D3plusConfig,
  ] => {
    if (!chart) return [null, {data: "", locale: ""}];

    const params = {fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t};
    const {locale} = chart.datagroup;

    if (chart.type === "barchart") {
      return [BarChartComponent, buildBarchartConfig(chart, params)];
    }
    if (chart.type === "choropleth") {
      return [ChoroplethComponent, buildChoroplethConfig(chart, params)];
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

    return [null, {data: "", locale}];
  }, [chart, fullMode, getFormatter, getMeasureConfig, showConfidenceInt, t]);
}

export function buildBarchartConfig(chart: BarChart, params: ChartBuilderParams) {
  const {fullMode, getFormatter, t} = params;
  const {datagroup, values, series, timeline, orientation} = chart;

  const {columns, dataset, locale} = datagroup;
  const [mainSeries, stackedSeries] = series;

  const collate = new Intl.Collator(locale, {numeric: true, ignorePunctuation: true});

  const measureFormatter = getFormatter(values.measure);
  const measureAggregator =
    values.measure.annotations.aggregation_method || values.measure.aggregator;
  const measureUnits = values.measure.annotations.units_of_measurement || "";
  const isPercentage = ["Percentage", "Rate"].includes(measureUnits);

  const config: D3plusConfig = {
    barPadding: fullMode ? 5 : 1,
    data: dataset,
    discrete: chart.orientation === "horizontal" ? "y" : "x",
    groupBy: stackedSeries?.name,
    groupPadding: fullMode ? 5 : 1,
    label: d => series.map(series => d[series.level.name]).join("\n"),
    legend: fullMode,
    locale,
    stacked:
      (stackedSeries && isOneOf(measureAggregator.toUpperCase(), ["COUNT", "SUM"])) ||
      isPercentage,
    time: timeline?.name === "Quarter ID" ? timeline.level.name : timeline?.name,
    timeline: timeline && fullMode,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    total: !timeline,
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
  };

  if (orientation === "horizontal") {
    Object.assign(config, {
      x: values.measure.name,
      xConfig: {
        title: values.measure.caption,
        tickFormat: (d: number) => measureFormatter(d, locale),
      },
      y: mainSeries.level.name,
      yConfig: {
        title: mainSeries.level.caption,
      },
      ySort: collate.compare,
    });
  } else {
    Object.assign(config, {
      x: mainSeries.level.name,
      xConfig: {
        title: mainSeries.level.caption,
      },
      y: values.measure.name,
      yConfig: {
        title: values.measure.caption,
        tickFormat: (d: number) => measureFormatter(d, locale),
      },
    });
  }

  return config;
}

export function buildChoroplethConfig(chart: ChoroplethMap, params: ChartBuilderParams) {
  const {datagroup, values, series, timeline} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;
  const {members: firstSeriesMembers} = series[0];

  const lastSeries = getLast(series);

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    colorScale: values.measure.name,
    colorScaleConfig: {
      axisConfig: {
        tickFormat: (d: number) => measureFormatter(d, locale),
      },
      scale: "jenks",
    },
    colorScalePosition: fullMode ? "right" : false,
    data: dataset,
    fitFilter: d => (firstSeriesMembers as string[]).includes(d.id ?? d.properties.id),
    groupBy: series.map(series => series.name),
    label: d => series.map(series => d[series.level.name]).join("\n"),
    locale,
    ocean: "transparent",
    projectionRotate: [0, 0],
    tiles: false,
    time: timeline?.level.name,
    timeline: fullMode && timeline?.level.name,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltip: true,
    tooltipConfig: {
      title(d) {
        return d[lastSeries.level.name] as string;
      },
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
    zoomScroll: false,
  };

  assign(config, chart.extraConfig);

  return config;
}

export function buildDonutConfig(chart: DonutChart, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;
  const [mainSeries] = series;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    groupBy: [mainSeries.name],
    label: d => d[mainSeries.level.name] as string,
    locale,
    time: timeline?.name,
    timeline: fullMode && timeline,
    timelineConfig: {
      brushing: false,
      playButton: false,
    },
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    total: !timeline,
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
    value: values.measure.name,
  };

  return config;
}

export function buildLineplotConfig(chart: LinePlot, params: ChartBuilderParams) {
  const {datagroup, values, series, timeline} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    discrete: "x",
    label: (d: DataPoint) => {
      return (
        series.map(series => d[series.level.name]).join("\n") ||
        t("vizbuilder.title.measure_on_period", {
          measure: values.measure.caption,
          period: d[timeline.level.name],
        })
      );
    },
    legend: fullMode,
    locale,
    groupBy: series.length ? series.map(series => series.name) : undefined,
    time: timeline.level.name,
    timeline: fullMode,
    timelineConfig: {
      brushing: true,
      playButton: false,
    },
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    total: false,
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
    x: timeline.level.name,
    xConfig: {
      title: timeline.level.caption,
    },
    y: values.measure.name,
    yConfig: {
      scale: "auto",
      tickFormat: (d: number) => measureFormatter(d, locale),
      title: values.measure.caption,
    },
  };

  return config;
}

export function buildStackedareaConfig(chart: StackedArea, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    groupBy: series.map(series => series.name),
    locale,
    time: timeline?.name,
    timeline: timeline && fullMode,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
    value: values.measure.name,
  };

  return config;
}

export function buildTreemapConfig(chart: TreeMap, params: ChartBuilderParams) {
  const {datagroup, series, timeline, values} = chart;
  const {fullMode, getFormatter, t} = params;

  const {columns, dataset, locale} = datagroup;

  const measureFormatter = getFormatter(values.measure);

  const config: D3plusConfig = {
    data: dataset,
    label: d => series.map(series => d[series.level.name]).join("\n"),
    locale,
    groupBy: series.map(series => series.name),
    sum: values.measure.name,
    threshold: 0.005,
    thresholdName: series[0].name,
    time: timeline?.name,
    timeline: timeline && fullMode,
    title: _buildTitle(t, chart),
    titleConfig: {
      fontSize: fullMode ? 20 : 10,
    },
    tooltipConfig: {
      tbody: _buildTooltipTbody(columns, values.measure, measureFormatter, locale),
    },
    totalFormat: d => t("vizbuilder.title.total", {value: measureFormatter(d, locale)}),
  };

  return config;
}

function _buildTooltipTbody(
  columns: Record<string, Column>,
  measure: TesseractMeasure,
  measureFormatter: Formatter,
  locale: string,
) {
  return d => {
    const {caption: meaCaption, name: meaName} = measure;
    return filterMap(Object.values(columns), column => {
      if (column.type === "measure") return null;
      if (column.type === "level" && column.hasID && column.isID) return null;
      const {caption, name} = getColumnEntity(column);
      return [caption, d[name]] as [string, string];
    }).concat([[meaCaption, measureFormatter(d[meaName] as number, locale)]]);
  };
}

function _buildTitle(t: TranslateFunction, chart: Chart) {
  const {series, values} = chart;
  const [mainSeries, otherSeries] = series;
  const {measure} = values;
  const timeline = chart.timeline || chart.time;
  console.log({chart})
  const seriesStr = (series: Chart["series"][number]) => {
    if(!series) return "";
    const {members} = series.captions[series.level.name];

    if (series.members.length < 5) {
      return t("vizbuilder.title.series_members", {
        series: series.level.caption,
        members: _buildTranslatedList(t, members as string[]),
      });
    }

    return t("vizbuilder.title.series", {
      series: series.level.caption,
    });
  };

  const getMembers = (data: DataPoint[] | undefined, series: Chart["series"][number]) => {
    if (!data) return series.members;
    return [...new Set(data.map(d => d[series.name]))].sort();
  };

  return (data?: DataPoint[]): string => {
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const valuesKey = `vizbuilder.aggregator.${aggregator.toLowerCase()}`;
    const values = otherSeries ? t(valuesKey, {measure: measure.caption}) : measure.caption;

    const config = {
      values: values === valuesKey ? measure.caption : values,
      measure: values === valuesKey ? measure.caption : values,
      series: otherSeries
        ? _buildTranslatedList(t, [seriesStr(mainSeries), seriesStr(otherSeries)])
        : seriesStr(mainSeries),
      time: timeline?.level.caption,
      period: timeline?.level.caption,
      time_period: timeline ? getLast(getMembers(data, timeline)) : "",
    };

    // time is on the axis, so multiple periods are shown at once
    if (isOneOf(chart.type, ["lineplot", "stackedarea"])) {
      if(!series.length) return t("vizbuilder.title.measure_over_period", config);
      return t("vizbuilder.title.main_over_period", config);
    }

    // time is on timeline dimension, so a single period is shown
    if (timeline) return t("vizbuilder.title.main_on_period", config);

    // time dimension is not part of the chart
    return t("vizbuilder.title.main", config);
  };
}

/**
 * Concatenates a list of strings, by offering the possibility to use special
 * syntax for the first and last items.
 */
function _buildTranslatedList(t: TranslateFunction, list: string[]) {
  return t("vizbuilder.list.suffix", {
    n: list.length,
    nlessone: list.length - 1,
    item: getLast<unknown>(list),
    rest: t("vizbuilder.list.prefix", {
      n: list.length - 1,
      nlessone: list.length - 2,
      item: list[0],
      rest: list.slice(1, -1).join(t("vizbuilder.list.join")),
      list: list.slice(0, -1).join(t("vizbuilder.list.join")),
    }),
    list: list.join(t("vizbuilder.list.join")),
  });
}
