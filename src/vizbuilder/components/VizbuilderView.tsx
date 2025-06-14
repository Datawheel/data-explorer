// we should fix this
// @ts-nocheck
import type {ChartLimits, Dataset} from "@datawheel/vizbuilder";
import React, {useMemo} from "react";
import type {TesseractCube} from "../../api";
import type {QueryParams, QueryResult} from "../../utils/structs";
import {buildColumn} from "../tooling/columns";
import {Vizbuilder} from "./Vizbuilder";
import {useVizbuilderData} from "../hooks/useVizbuilderData";
import {LoadingOverlay} from "../../components/LoadingOverlay";

export function VizbuilderView(props: {cube: TesseractCube; params: QueryParams}) {
  const {cube, params} = props;

  const query = useVizbuilderData();

  if (query.isLoading) {
    return <LoadingOverlay visible={true} />;
  }
  const data = query.data;
  const types = query.data?.types;
  const columns = Object.keys(types || {});

  const filteredData = (data?.data || []).filter(row =>
    Object.values(row).every(value => value !== null)
  );
  const dataset = {
    columns: Object.fromEntries(
      columns.map(columnName => [columnName, buildColumn(cube, columnName, columns)])
    ),
    data: filteredData,
    locale: params.locale || "en"
  };

  return <Vizbuilder datasets={dataset} />;
}
