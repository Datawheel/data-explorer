type Annotations = Record<string, string | undefined>;

export enum Aggregator {
  avg = "avg",
  basic_grouped_median = "basic_grouped_median",
  count = "count",
  max = "max",
  median = "median",
  min = "min",
  mode = "mode",
  moe = "moe",
  quantile = "quantile",
  replicate_weight_moe = "replicate_weight_moe",
  sum = "sum",
  weighted_average_moe = "weighted_average_moe",
  weighted_avg = "weighted_avg",
  weighted_sum = "weighted_sum",
}

export enum DimensionType {
  geo = "geo",
  standard = "standard",
  time = "time",
}

export interface TesseractDataRequest {
  cube: string;
  drilldowns: string;
  measures: string;
  exclude?: string;
  filters?: string;
  include?: string;
  limit?: string;
  locale?: string;
  parents?: boolean | string;
  properties?: string;
  ranking?: boolean | string;
  sort?: string;
  time?: string;
}

export interface TesseractDataResponse {
  columns: string[];
  data: string[][];
}

export interface TesseractMembersRequest {
  cube: string;
  level: string;
  limit?: string;
  locale?: string;
  parents?: boolean;
  search?: string;
}

export interface TesseractMembersResponse {
  /** Name of the relevant level */
  name: string;
  /** Public localized name of the relevant level */
  caption: string;
  /** Depth of the level in its Hierarchy */
  depth: number;
  /** Metadata for the level */
  annotations: Annotations;
  /** Child Properties from this level */
  properties: TesseractProperty[];
  /** Data type of each column in the members array */
  dtypes: {[K in keyof MemberRow]: string};
  /** The actual list of members for the level */
  members: MemberRow[];
}

export interface TesseractStatus {
  module: string;
  version: string;
  debug: false | Record<string, string>;
  extras: Record<string, string>;
}

export interface TesseractSchema {
  name: string;
  locales: string[];
  default_locale: string;
  annotations: Annotations;
  cubes: TesseractCube[];
}

export interface TesseractCube {
  name: string;
  caption: string;
  annotations: Annotations;
  dimensions: TesseractDimension[];
  measures: TesseractMeasure[];
}

export interface TesseractMeasure {
  name: string;
  caption: string;
  annotations: Annotations;
  aggregator: Aggregator;
  attached: TesseractMeasure[];
}

export interface TesseractDimension {
  name: string;
  caption: string;
  annotations: Annotations;
  type: DimensionType;
  hierarchies: TesseractHierarchy[];
  default_hierarchy: string;
}

export interface TesseractHierarchy {
  name: string;
  caption: string;
  annotations: Annotations;
  levels: TesseractLevel[];
}

export interface TesseractLevel {
  name: string;
  caption: string;
  annotations: Annotations;
  depth: number;
  properties: TesseractProperty[];
}

export interface TesseractProperty {
  name: string;
  caption: string;
  annotations: Annotations;
  type: string;
}

export interface MemberRow {
  /** The unique ID for this member */
  key: string | number;
  /** The localized label for this member */
  caption?: string;
  /** A list of direct ancestor members, one per level above this one */
  ancestor?: MemberRow[];
}
