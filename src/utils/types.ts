import {PlainCube} from "@datawheel/olap-client";
import React from "react";
import {QueryParams, QueryResult} from "./structs";
import type {MRT_TableInstance} from "mantine-react-table";

export interface Annotated {
  annotations: Record<string, string | undefined>;
}

export interface FileDescriptor {
  content: Blob | string;
  extension: string;
  name: string;
}

export type Formatter = (value: number | null, locale?: string) => string;

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

export interface ViewProps<TData = Record<string, string | number>> {
  className?: string;
  cube: PlainCube;
  panelKey: string | null;
  params: QueryParams;
  result: QueryResult<TData>;
  table?: MRT_TableInstance<TData & Record<string, any>>;
  isError: boolean;
  isLoading: boolean;
}
