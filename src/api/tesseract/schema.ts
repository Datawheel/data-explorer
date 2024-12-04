import type {Aggregator, DimensionType} from "../enum";

type Annotations = Record<string, string | undefined>;

export interface TesseractErrorResponse {
  error: true;
  detail: string;
}

export interface TesseractDataRequest {
  cube: string;

  /**
   * @example LevelName,LevelName,LevelName
   */
  drilldowns: string;

  /**
   * @example Measure,Measure,Measure
   */
  measures: string;

  /**
   * @example Level:key,key,key;Level:key,key,key
   */
  exclude?: string;

  /**
   * @example Measure.gt.10000.and.lt.60000,Measure.lt.100000
   */
  filters?: string;

  /**
   * @example Level:key,key,key;Level:key,key,key
   */
  include?: string;

  /**
   * A single number is limit; a pair of numbers are limit, offset.
   * @example 2,5
   */
  limit?: string;

  /**
   * @example es
   */
  locale?: string;

  /**
   * A boolean enables parents for all levels in the request.
   * You can also pick specific Levels from the drilldown list.
   * @example true
   * @example Level,Level
   */
  parents?: boolean | string;

  /**
   * @example Property,Property
   */
  properties?: string;

  /**
   * A boolean sets rankings for all measures in descending order.
   * If setting measure names, orden can be set with or without a leading minus.
   * @example true
   * @example Measure,-Measure
   */
  ranking?: boolean | string;

  /**
   * @example Measure.asc
   * @example Property.desc
   */
  sort?: string;

  /**
   * Determines if the request should return the full cardinality of available
   * options, even if their associated value is null.
   * @default true
   */
  sparse?: boolean;

  /**
   * @example month.latest.6
   * @example Level.oldest
   */
  time?: string;

  /**
   * Slices the resulting items to only the highest/lowest N items by the value
   * of Measure, for all the subgroups signaled by the Level parameters.
   * @example 10.Level.Measure.asc
   * @example 3.Level,Level.Measure.desc
   */
  top?: string;

  /**
   * Calculates the growth in Measure for each Level using one of these methods:
   * - fixed: Calculates growth against a fixed member key from Level
   * - period: Calculates growth comparing a time point with its previous N point
   * @example Level.Measure.fixed.201804
   * @example Level.Measure.period.3
   */
  growth?: string;
}

export interface TesseractDataResponse {
  error?: true;
  detail?: string;
  columns: string[];
  data: Record<string, unknown>[];
  page: {
    limit: number;
    offset: number;
    total: number;
  };
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
  dimensionType: DimensionType;
  dimension: string;
  hierarchy: string;
  /** Depth of the level in its Hierarchy */
  depth: number;
  /** Metadata for the level */
  annotations: Annotations;
  /** Child Properties from this level */
  properties: TesseractProperty[];
  /** Data type of each column in the members array */
  dtypes: {[K in keyof TesseractMember]: string};
  /** The actual list of members for the level */
  members: TesseractMember[];
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
  type?: "geo" | "time" | string;
  count?: number;
}

export interface TesseractProperty {
  name: string;
  caption: string;
  annotations: Annotations;
  type: string;
}

export interface TesseractMember {
  /** The unique ID for this member */
  key: string | number;
  /** The localized label for this member */
  caption?: string;
  /** A list of direct ancestor members, one per level above this one */
  ancestor?: TesseractMember[];
}
