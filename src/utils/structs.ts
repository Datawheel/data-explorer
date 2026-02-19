import {Comparison} from "../api/enum";
import type {TesseractLevel, TesseractMeasure, TesseractProperty} from "../api/tesseract/schema";
import {asArray} from "./array";
import {parseNumeric, randomKey} from "./string";

export interface QueryItem {
  created: string;
  isDirty: boolean;
  key: string;
  label: string;
  panel: string | null;
  chart: string | null;
  params: QueryParams;
  result: QueryResult;
  link?: string;
}

export interface QueryParams {
  booleans: Record<string, undefined | boolean>;
  cube: string;
  cuts: Record<string, CutItem>;
  drilldowns: Record<string, DrilldownItem>;
  filters: Record<string, FilterItem>;
  locale: string | undefined;
  measures: Record<string, MeasureItem>;
  isPreview: boolean;
  pagiLimit: number;
  pagiOffset: number;
  sortDir: "asc" | "desc";
  sortKey: string | undefined;
  timeComplete: string | undefined;
}

export interface QueryResult<D = Record<string, unknown>> {
  data: D[];
  page: {
    limit: number;
    offset: number;
    total: number;
  };
  types: Record<string, AnyResultColumn>;
  headers?: Record<string, string>;
  status: number;
  url: string;
}

interface ResultEntityType {
  level: TesseractLevel & {dimension?: string};
  property: TesseractProperty;
  measure: TesseractMeasure;
}

export interface ResultColumn<T extends keyof ResultEntityType> {
  label: string;
  localeLabel: string;
  isId: boolean;
  entity: ResultEntityType[T];
  entityType: T;
  valueType: "boolean" | "number" | "string";
  range?: [number, number];
}

export type AnyResultColumn =
  | ResultColumn<"level">
  | ResultColumn<"measure">
  | ResultColumn<"property">;

export interface QueryParamsItem {
  active: boolean;
  readonly key: string;
}

export interface CutItem extends QueryParamsItem {
  dimension: string;
  hierarchy: string;
  level: string;
  members: string[];
}

export interface DrilldownItem extends QueryParamsItem {
  captionProperty: string;
  dimension: string;
  hierarchy: string;
  level: string;
  properties: PropertyItem[];
  members: {key: string | number; caption?: string}[];
}

export interface FilterItem extends QueryParamsItem {
  measure: string;
  conditionOne: [`${Comparison}`, string, number];
  conditionTwo?: [`${Comparison}`, string, number];
  joint: "and" | "or";
  type?: "greaterThan" | "lessThan" | "between";
}

export interface MeasureItem extends QueryParamsItem {
  name: string;
  caption?: string;
}

export interface MemberItem extends QueryParamsItem {
  name: string;
}

export interface NamedSetItem extends QueryParamsItem {
  namedset?: string;
}

export interface PropertyItem extends QueryParamsItem {
  level: string;
  name: string;
}

type RecursivePartial<T> = {
  [K in keyof T]?: T[K] extends string | boolean | number | bigint | symbol
    ? T[K]
    : RecursivePartial<T[K]>;
};

/**
 * Creates a QueryItem object.
 */
export function buildQuery(props: RecursivePartial<QueryItem>): QueryItem {
  return {
    created: props.created || new Date().toISOString(),
    key: props.key || randomKey(),
    label: props.label || "",
    isDirty: true,
    panel: props.panel || null,
    chart: props.chart || null,
    params: buildQueryParams(props.params || {}),
    result: {
      data: [],
      page: {
        limit: 0,
        offset: 0,
        total: 0
      },
      types: {},
      headers: {},
      status: 0,
      url: ""
    }
  };
}

/**
 * Creates a QueryParams object.
 */
export function buildQueryParams(props): QueryParams {
  return {
    booleans: props.booleans || {},
    cube: props.cube || "",
    cuts: props.cuts || {},
    drilldowns: props.drilldowns || {},
    filters: props.filters || {},
    isPreview: props.isPreview || false,
    locale: props.locale || "",
    measures: props.measures || {},
    pagiLimit: props.pagiLimit || props.limitAmount || props.limit || 100,
    pagiOffset: props.pagiOffset || props.limitOffset || props.offset || 0,
    sortDir: props.sortDir || props.sortDirection || props.sortOrder || props.order || "desc",
    sortKey: props.sortKey || props.sortProperty || "",
    timeComplete: props.timeComplete || undefined
  };
}

/**
 * Creates a CutItem object.
 */
export function buildCut(props): CutItem {
  const dimension = `${props.dimension}`;
  const hierarchy = `${props.hierarchy}`;
  const level = `${props.level || props.name}`;
  return {
    active: typeof props.active === "boolean" ? props.active : false,
    key: props.key || randomKey(),
    dimension,
    hierarchy,
    level,
    members: Array.isArray(props.members) ? props.members : []
  };
}

/**
 * Creates a DrilldownItem object.
 */
export function buildDrilldown(props: {
  active?: boolean;
  key?: string;
  name?: string;
  dimension?: string;
  hierarchy?: string;
  level?: string;
  members?: {key: string | number; caption?: string}[];
  captionProperty?: string;
  properties?: (TesseractProperty | Partial<Omit<PropertyItem, "key">>)[];
}): DrilldownItem {
  return {
    active: typeof props.active === "boolean" ? props.active : true,
    key: props.key || randomKey(),
    captionProperty: props.captionProperty || "",
    dimension: `${props.dimension || ""}`,
    hierarchy: `${props.hierarchy || ""}`,
    level: `${props.level || props.name}`,
    properties: asArray(props.properties).map(buildProperty),
    members: Array.isArray(props.members) ? props.members : []
  };
}

/**
 * Creates a FilterItem object.
 */
export function buildFilter(props: {
  active?: boolean;
  key?: string;
  measure?: string;
  name?: string;
  const1?: [Comparison, number];
  const2?: [Comparison, number];
  conditionOne?: [`${Comparison}`, string, number];
  conditionTwo?: [`${Comparison}`, string, number];
  comparison?: string;
  inputtedValue?: string;
  interpretedValue?: string;
  joint?: string;
  type?: "greaterThan" | "lessThan" | "between";
}): FilterItem {
  return {
    active: typeof props.active === "boolean" ? props.active : true,
    key: props.key || randomKey(),
    measure: props.measure || `${props.name}`,
    conditionOne: props.conditionOne || [
      props.const1 ? `${props.const1[0]}` : `${Comparison.GT}`,
      props.const1 ? props.const1[1].toString() : props.inputtedValue || "",
      props.const1 ? props.const1[1] : parseNumeric(props.interpretedValue, NaN)
    ],
    conditionTwo:
      props.conditionTwo ||
      (props.const2
        ? [
            `${props.const2[0]}`,
            props.const2[1].toString(),
            parseNumeric(props.const2[1].toString(), NaN)
          ]
        : undefined),
    joint: props.joint === "or" ? "or" : "and",
    type: props.type
  };
}

/**
 * Creates a MeasureItem object.
 */
export function buildMeasure(props: {
  active?: boolean;
  key?: string;
  name?: string;
  caption?: string;
}): MeasureItem {
  return {
    active: typeof props.active === "boolean" ? props.active : false,
    key: props.key || props.name || randomKey(),
    name: props.name || props.key || `${props}`,
    caption: props.caption || props.name || props.key
  };
}

/**
 * Creates a MemberItem object.
 */
export function buildMember(props): MemberItem {
  return {
    active: typeof props.active === "boolean" ? props.active : false,
    key: props.key || props.name || `${props}`,
    name: props.name || props.key || `${props}`
  };
}

/**
 * Creates a PropertyItem object.
 */
export function buildProperty(
  props:
    | TesseractProperty
    | {
        active?: boolean;
        key?: string;
        level?: string;
        name?: string;
        property?: string;
      }
): PropertyItem {
  if ("active" in props) {
    return {
      active: typeof props.active === "boolean" ? props.active : false,
      key: props.key || randomKey(),
      level: props.level || "",
      name: props.name || props.property || ""
    };
  }
  return {
    active: false,
    key: randomKey(),
    level: "",
    name: props.name || ""
  };
}
