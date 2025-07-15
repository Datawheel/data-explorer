import type {TranslateFunction} from "@datawheel/use-translation";
import type {Chart, D3plusConfig} from "@datawheel/vizbuilder";
import {
  d3plusConfigBuilder,
  type Formatter,
  useVizbuilderContext,
} from "@datawheel/vizbuilder/react";
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

interface ChartBuilderParams {
  fullMode: boolean;
  getFormatter: (key: string | TesseractMeasure) => Formatter;
  getMeasureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;
  showConfidenceInt: boolean;
  t: TranslateFunction;
}

export function useD3plusConfig(
  chart: Chart,
  params: Pick<ChartBuilderParams, "fullMode" | "showConfidenceInt" | "t">,
) {
  const {fullMode, showConfidenceInt, t} = params;

  const {getMeasureConfig, getFormatter, translationNamespace, postprocessConfig} =
    useVizbuilderContext();

  return useMemo((): [
    React.ComponentType<{config: D3plusConfig}> | null,
    D3plusConfig | false,
  ] => {
    const params: ChartBuilderParams = {
      fullMode,
      getFormatter,
      getMeasureConfig,
      showConfidenceInt,
      t: translationNamespace
        ? (template, data) => t(`${translationNamespace}.${template}`, data)
        : t,
    };

    if (chart.type === "barchart") {
      const config = d3plusConfigBuilder.barchart(chart, params);
      return [BarChartComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "choropleth") {
      const config = d3plusConfigBuilder.choropleth(chart, params);
      if (chart.extraConfig.d3plus) assign(config, chart.extraConfig.d3plus);
      return [ChoroplethComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "donut") {
      const config = d3plusConfigBuilder.donut(chart, params);
      return [DonutComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "lineplot") {
      const config = d3plusConfigBuilder.lineplot(chart, params);
      return [LinePlotComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "stackedarea") {
      const config = d3plusConfigBuilder.stackedarea(chart, params);
      return [StackedAreaComponent, postprocessConfig(config, chart, params)];
    }
    if (chart.type === "treemap") {
      const config = d3plusConfigBuilder.treemap(chart, params);
      return [TreeMapComponent, postprocessConfig(config, chart, params)];
    }

    return [null, {data: [], locale: ""}];
  }, [
    chart,
    fullMode,
    getFormatter,
    getMeasureConfig,
    postprocessConfig,
    showConfidenceInt,
    t,
    translationNamespace,
  ]);
}
