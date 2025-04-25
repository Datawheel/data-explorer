import React from "react";
import {Loader, LoadingOverlay} from "@mantine/core";

import {usePivotTableData} from "../vizbuilder/hooks/usePivotTableData";
import {PivotViewTable} from "./PivotViewTable";
import {ViewProps} from "../utils/types";
import {type MRT_TableOptions as TableOptions} from "mantine-react-table";
import {NonIdealState} from "./NonIdealState";
import {useTranslation} from "../hooks/translation";
import {useServerSchema} from "../hooks/useQueryApi";

export function PivotView<TData extends Record<string, unknown>>(
  props: {} & ViewProps<TData> & TableOptions<TData>
) {
  const {translate: t} = useTranslation();
  const {isLoading, data: result} = usePivotTableData();
  const {isLoading: schemaLoading} = useServerSchema();
  if (isLoading || schemaLoading) {
    return (
      <NonIdealState
        icon={<Loader size="xl" />}
        title={t("pivot_view.loading_title")}
        description={t("pivot_view.loading_details")}
      />
    );
  }

  return (
    <PivotViewTable
      {...props}
      data={(result?.data || []) as (Record<string, string | number> & TData)[]}
    />
  );
}
