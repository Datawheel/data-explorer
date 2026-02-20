import React from "react";
import type {MRT_ColumnDef, MRT_PaginationState, MRT_TableInstance} from "mantine-react-table";
import type {TesseractCube} from "../api";
import type {QueryParams, QueryResult} from "./structs";

export interface Annotated {
  annotations: Record<string, string | undefined>;
}

export interface FileDescriptor {
  content: Blob | string;
  extension: string;
  name: string;
}

export type Formatter = (value: number | null, locale?: string) => string;
export type DrilldownFormatter = (value: string | null, locale?: string) => string;

export interface JSONArrays {
  headers: string[];
  data: [string, ...(number | undefined)[]][];
}

export interface LevelDescriptor {
  dimension: string;
  hierarchy: string;
  level: string;
}

export interface PanelDescriptor {
  key: string;
  label: string;
  component: React.ComponentType<ViewProps>;
}

export interface ViewProps<TData extends Record<string, any> = Record<string, string | number>> {
  className?: string;
  cube: TesseractCube;
  panelKey: string | null;
  params: QueryParams;
  result?: QueryResult<TData>;
  table?: MRT_TableInstance<TData & Record<string, any>>;
  isError?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  data?: Record<string, string | number>[];
  columns?: MRT_ColumnDef<TData>[];
  pagination?: MRT_PaginationState;
  setPagination?: React.Dispatch<React.SetStateAction<MRT_PaginationState>>;
}
