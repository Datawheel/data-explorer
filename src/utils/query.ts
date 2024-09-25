import {Comparison, type TesseractDataRequest} from "../api";
import type {TesseractCube} from "../api/tesseract/schema";
import {filterMap} from "./array";
import {
  type QueryParams,
  buildCut,
  buildDrilldown,
  buildFilter,
  buildMeasure,
  buildProperty,
} from "./structs";
import {keyBy} from "./transform";

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
    limit: `${params.pagiLimit || 0},${params.pagiOffset || 0}`,
    sort: params.sortKey ? `${params.sortKey}.${params.sortDir}` : undefined,
    // sparse: params.sparse,
    // ranking:
    //   typeof params.ranking === "boolean"
    //     ? params.ranking
    //     : Object.entries(params.ranking)
    //         .map(item => (item[1] ? "-" : "") + item[0])
    //         .sort()
    //         .join(","),
    // parents:
    //   typeof params.parents === "boolean" ? params.parents : params.parents.join(","),
  };

  function strFilterCondition(cond: [string, string, number]): string {
    return `${cond[0]}.${cond[2]}`;
  }
}

export function extractDataRequest(
  cube: TesseractCube,
  search: URLSearchParams,
): QueryParams {
  const dimensions: Record<string, string> = {};
  const hierarchies: Record<string, string> = {};
  const levels = Object.fromEntries(
    cube.dimensions.flatMap(dim =>
      dim.hierarchies.flatMap(hie =>
        hie.levels.map(lvl => {
          dimensions[lvl.name] = dim.name;
          hierarchies[lvl.name] = hie.name;
          return [lvl.name, lvl];
        }),
      ),
    ),
  );

  const properties = getList(search, "properties", ",");
  const drilldowns = getList(search, "drilldowns", ",").map(name => {
    const lvl = levels[name];
    return buildDrilldown({
      active: true,
      dimension: dimensions[name],
      hierarchy: hierarchies[name],
      level: name,
      properties: filterMap(lvl.properties, prop =>
        properties.includes(prop.name)
          ? buildProperty({name: prop.name, level: name, active: true})
          : null,
      ),
    });
  });
  const cuts = getList(search, "include", ";").map(cut => {
    const [name, members] = cut.split(":");
    const lvl = levels[name];
    return buildCut({
      active: true,
      dimension: dimensions[name],
      hierarchy: hierarchies[name],
      level: name,
      members: members.split(","),
    });
  });
  const measures = getList(search, "measures", ",").map(name =>
    buildMeasure({name, active: true}),
  );
  const filters = getList(search, "filters", ",").map(filter => {
    const dotName = filter.indexOf(".");
    const condition = filter.slice(dotName + 1);
    const joint = condition.includes(".and.") ? "and" : "or";
    const [cond1, cond2] = condition.split(joint);
    return buildFilter({
      active: true,
      measure: filter.slice(0, dotName),
      joint,
      conditionOne: parseFilterCondition(cond1),
      conditionTwo: cond2 ? parseFilterCondition(cond2) : undefined,
    });
  });

  const [limit = "0", offset = "0"] = (search.get("limit") || "0").split(",");
  const [sortKey, sortDir] = (search.get("sort") || "").split(".");

  return {
    cube: cube.name,
    locale: search.get("locale") || undefined,
    drilldowns: keyBy(drilldowns, "key"),
    measures: keyBy(measures, "key"),
    cuts: keyBy(cuts, "key"),
    filters: keyBy(filters, "key"),
    pagiLimit: Number(limit),
    pagiOffset: Number(offset),
    sortDir: sortDir === "asc" ? "asc" : "desc",
    sortKey: sortKey || undefined,
    isPreview: false,
    booleans: {
      // parents: search.get("parents") || undefined,
    },
  };

  function getList(params: URLSearchParams, key: string, separator: string): string[] {
    return params
      .getAll(key)
      .join(separator)
      .split(separator)
      .filter(token => token);
  }

  function parseFilterCondition(value: string): [Comparison, string, number] {
    const index = value.indexOf(".");
    const number = value.slice(index + 1);
    return [Comparison[value.slice(0, index)], number, Number(number)];
  }
}
