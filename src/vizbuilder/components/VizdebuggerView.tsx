import {buildColumn} from "@datawheel/vizbuilder";
import {Vizdebugger} from "@datawheel/vizbuilder/react";
// @ts-ignore
import type {TesseractCube} from "@datawheel/vizbuilder/schema";
import {LoadingOverlay} from "@mantine/core";
import React, {useMemo} from "react";
import type {QueryParams} from "../../utils/structs";
import {useQueryData} from "../hooks/query";

export function VizdebuggerView(props: {cube: TesseractCube; params: QueryParams}) {
  const {cube, params} = props;

  const result = useQueryData({...params, pagiLimit: 0, pagiOffset: 0});

  const datasets = useMemo(() => {
    if (result.isPending) return [];

    if (result.isError) {
      console.error(result.error.message);
      return [];
    }

    const {columns, data, error, detail} = result.data;

    if (error) {
      console.error(detail);
      return [];
    }

    const measureNames = Object.values(params.measures).map(msr => msr.name);

    return [
      {
        columns: Object.fromEntries(
          columns.map(columnName => [columnName, buildColumn(cube, columnName, columns)])
        ),
        data: data.filter(row => measureNames.every(measure => row[measure] !== null)),
        locale: params.locale || "en"
      }
    ];
  }, [cube, result, params.locale, params.measures]);

  if (result.isPending) {
    return <LoadingOverlay visible={true} />;
  }

  return <Vizdebugger datasets={datasets} />;
}
