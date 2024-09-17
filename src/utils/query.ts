import {Measure, type Query} from "@datawheel/olap-client";
import type {TesseractDataRequest} from "../api";
import {filterMap} from "./array";
import {
  type CutItem,
  type DrilldownItem,
  type FilterItem,
  type MeasureItem,
  type QueryParams,
  type QueryParamsItem,
  buildCut,
  buildDrilldown,
  buildFilter,
  buildMeasure,
} from "./structs";
import {keyBy} from "./transform";
import {isActiveCut, isActiveItem} from "./validation";

export function buildDataRequest(params: QueryParams): TesseractDataRequest {
  return {
    cube: params.cube,
    locale: params.locale,
    drilldowns: filterMap(Object.values(params.drilldowns), item =>
      item.active ? item.level : null,
    ).join(","),
    measures: filterMap(Object.values(params.measures), item =>
      item.active ? item.name : null,
    ).join(","),
    properties: filterMap(Object.values(params.drilldowns), item =>
      item.active
        ? filterMap(item.properties, item => (item.active ? item.name : null))
        : null,
    )
      .flat()
      .join(","),
    include: filterMap(Object.values(params.cuts), item =>
      item.active ? `${item.level}:${item.members.join(",")}` : null,
    ).join(";"),
    // exclude: filterMap(Object.values(params.exclude), item =>
    //   item.active ? `${item.level}:${item.members.join(",")}` : null,
    // ).join(";"),
    filters: filterMap(Object.values(params.filters), item =>
      item.active
        ? `${item.measure}.${strFilterCondition(item.conditionOne)}${
            item.conditionTwo
              ? `.${item.joint}.${strFilterCondition(item.conditionTwo)}`
              : ""
          }`
        : null,
    ).join(";"),
    limit: `${params.pageLimit || 0},${params.pageOffset || 0}`,
    sort: params.sortKey ? `${params.sortKey}.${params.sortDir}` : undefined,
    sparse: params.sparse,
    ranking:
      typeof params.ranking === "boolean"
        ? params.ranking
        : Object.entries(params.ranking)
            .map(item => (item[1] ? "-" : "") + item[0])
            .sort()
            .join(","),
    parents:
      typeof params.parents === "boolean" ? params.parents : params.parents.join(","),
  };

  function strFilterCondition(cond: [string, string, number]): string {
    return `${cond[0]}.${cond[2]}`;
  }
}

/**
 * Applies the properties set on a QueryParams object
 * to an OlapClient Query object.
 */
export function applyQueryParams(
  query: Query,
  params: QueryParams,
  settings: {
    previewLimit: number;
  }
) {

  Object.entries(params.booleans).forEach(item => {
    item[1] != null && query.setOption(item[0], item[1]);
  });

  Object.values(params.cuts).forEach(item => {
    isActiveCut(item) && query.addCut(item, item.members);
  });


  Object.values(params.filters).forEach(item => {
    isActiveItem(item) && query.addFilter(item.measure, item.conditionOne,
      item.joint && item.conditionTwo ? item.joint : "",
      item.joint && item.conditionTwo ? item.conditionTwo : "")
  });

  Object.values(params.drilldowns).forEach(item => {
    if (!isActiveItem(item)) return;
    query.addDrilldown(item);
    item.captionProperty &&
      query.addCaption({ ...item, property: item.captionProperty });
    item.properties.forEach(prop => {
      isActiveItem(prop) && query.addProperty({ ...item, property: prop.name });
    });
  });

  Object.values(params.measures).forEach(item => {
    if (!isActiveItem(item)) return;
    query.addMeasure(item.name);
  });

  params.locale && query.setLocale(params.locale);

  if (params.sortKey && params.sortDir) {
    query.setSorting(params.sortKey, params.sortDir === "desc");
  }

  if (params.isPreview) {
    query.setPagination(settings.previewLimit, 0);
  }
  else {
    query.setPagination(params.pagiLimit || 0, params.pagiOffset);
  }

  return query;
}

/**
 * Extracts the properties set in an OlapClient Query object
 * to a new QueryParams object.
 */
export function extractQueryParams(query: Query): QueryParams {
  const cube = query.cube;

  const booleans = query.getParam("options");
  // TODO: parse properties too
  const drilldowns = query.getParam("drilldowns").map(buildDrilldown);
  const filters = query.getParam("filters").map(buildFilter);
  const measures = query.getParam("measures").map(buildMeasure);

  const cutRecord = query.getParam("cuts");
  const cuts = Object.keys(cutRecord).map(cutLevel => {
    const level = cube.getLevel(cutLevel);
    return buildCut({
      ...level.toJSON(),
      active: true,
      members: cutRecord[cutLevel],
      membersLoaded: false
    });
  });

  const pagination = query.getParam("pagination");
  const sorting = query.getParam("sorting");

  const getKey = <T extends QueryParamsItem>(item: T) => item.key;

  return {
    booleans: {
      debug: Boolean(booleans.debug),
      distinct: Boolean(booleans.distinct),
      exclude_default_members: Boolean(booleans.exclude_default_members),
      nonempty: Boolean(booleans.nonempty),
      parents: Boolean(booleans.parents),
      sparse: Boolean(booleans.sparse)
    },
    cube: cube.name,
    cuts: keyBy<CutItem>(cuts, getKey),
    drilldowns: keyBy<DrilldownItem>(drilldowns, getKey),
    filters: keyBy<FilterItem>(filters, getKey),
    locale: query.getParam("locale"),
    measures: keyBy<MeasureItem>(measures, getKey),
    pagiLimit: pagination.limit,
    pagiOffset: pagination.offset,
    isPreview: true,
    sortDir: sorting.direction === "asc" ? "asc" : "desc",
    sortKey: Measure.isMeasure(sorting.property)
      ? sorting.property.name
      : `${sorting.property || ""}`
  };
}
