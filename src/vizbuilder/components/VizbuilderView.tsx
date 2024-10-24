import type {ChartLimits, Column, Dataset} from "@datawheel/vizbuilder";
import React, {useMemo} from "react";
import type {TesseractCube} from "../../api";
import type {QueryParams, QueryResult} from "../../utils/structs";
import {buildColumn} from "../tooling/columns";
import {Vizbuilder} from "./Vizbuilder";

const CHART_LIMITS: Partial<ChartLimits> = {
  BARCHART_MAX_BARS: 20,
  BARCHART_YEAR_MAX_BARS: 20,
  BARCHART_MAX_STACKED_BARS: 10,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_POINT_MIN: 2,
  LINEPLOT_LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1000,
};

const DOWNLOAD_FORMATS = ["SVG", "PNG"];

export function VizbuilderView(props: {
  cube: TesseractCube;
  params: QueryParams;
  result: QueryResult;
}) {
  const {cube, params, result} = props;

  const dataset = useMemo<Dataset | Dataset[]>(() => {
    const columns = Object.keys(result.types);
    return {
      columns: Object.fromEntries(
        columns.map(columnName => [
          columnName,
          buildColumn(cube, columnName, columns) as Column,
        ]),
      ),
      data: result.data,
      locale: params.locale || "en",
    };
  }, [cube, result, params.locale]);

  return (
    <Vizbuilder
      datasets={dataset}
      chartLimits={CHART_LIMITS}
      downloadFormats={DOWNLOAD_FORMATS}
    />
  );
}
