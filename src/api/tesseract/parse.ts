import {filterMap} from "../../utils/array";
import {
  type FilterItem,
  type QueryParams,
  buildCut,
  buildDrilldown,
  buildMeasure,
  buildProperty
} from "../../utils/structs";
import {keyBy} from "../../utils/transform";
import {Comparison} from "../enum";
import type {TesseractCube, TesseractDataRequest} from "./schema";

export function queryParamsToRequest(params: QueryParams): TesseractDataRequest {
  return {
    cube: params.cube,
    locale: params.locale,
    drilldowns: filterMap(Object.values(params.drilldowns), item =>
      item.active ? item.level : null
    ).join(","),
    measures: filterMap(Object.values(params.measures), item =>
      item.active ? item.name : null
    ).join(","),
    properties: filterMap(Object.values(params.drilldowns), item =>
      item.active ? filterMap(item.properties, item => (item.active ? item.name : null)) : null
    )
      .flat()
      .join(","),
    include: filterMap(Object.values(params.cuts), item =>
      item.active ? `${item.level}:${item.members.join(",")}` : null
    ).join(";"),
    // exclude: filterMap(Object.values(params.exclude), item =>
    //   item.active ? `${item.level}:${item.members.join(",")}` : null,
    // ).join(";"),
    filters: filterMap(Object.values(params.filters), item =>
      item.active ? filterSerialize(item) : null
    ).join(","),
    limit: `${params.pagiLimit || 0},${params.pagiOffset || 0}`,
    sort: params.sortKey ? `${params.sortKey}.${params.sortDir}` : undefined
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

export function requestToQueryParams(cube: TesseractCube, search: URLSearchParams): QueryParams {
  const dimensions: Record<string, string> = {};
  const hierarchies: Record<string, string> = {};
  const levels = Object.fromEntries(
    cube.dimensions.flatMap(dim =>
      dim.hierarchies.flatMap(hie =>
        hie.levels.map(lvl => {
          dimensions[lvl.name] = dim.name;
          hierarchies[lvl.name] = hie.name;
          return [lvl.name, lvl];
        })
      )
    )
  );

  const properties = getList(search, "properties", ",");
  const drilldowns = getList(search, "drilldowns", ",").map(name => {
    const lvl = levels[name];
    return buildDrilldown({
      active: true,
      key: lvl.name,
      dimension: dimensions[name],
      hierarchy: hierarchies[name],
      level: name,
      properties: filterMap(lvl.properties, prop =>
        properties.includes(prop.name)
          ? buildProperty({name: prop.name, level: name, active: true})
          : null
      )
    });
  });

  const cuts = filterMap(getList(search, "include", ";"), cut => {
    const [name, members] = cut.split(":");
    return levels[name]
      ? buildCut({
          active: true,
          dimension: dimensions[name],
          hierarchy: hierarchies[name],
          level: name,
          members: members.split(",")
        })
      : null;
  });
  const measures = getList(search, "measures", ",").map(name => {
    const measureOlap = cube.measures.find(m => m.name === name);
    return buildMeasure(measureOlap ? {...measureOlap, active: true} : {name, active: true});
  });

  const filters = getList(search, "filters", ",").map(filterParse);

  console.log(filters, "ACA");

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
    }
  };

  function getList(params: URLSearchParams, key: string, separator: string): string[] {
    return params
      .getAll(key)
      .join(separator)
      .split(separator)
      .filter(token => token);
  }
}

export function filterSerialize(item: FilterItem): string {
  const conditions = filterMap([item.conditionOne, item.conditionTwo], cond =>
    cond ? `${cond[0]}.${cond[2]}` : null
  );
  return `${item.measure}.${conditions.join(`.${item.joint}.`)}`;
}

function filterParseCondition(value) {
  const index = value.indexOf(".");
  const number = value.slice(index + 1);
  return [Comparison[value.slice(0, index)], number, Number(number)];
}

// Main filterParse function (updated to use the new filterParseCondition)
function filterParse(item) {
  const indexName = item.indexOf(".");
  const condition = item.slice(indexName + 1);
  const joint = condition.includes(".and.") ? "and" : "or";
  const [cond1, cond2] = condition.split(`.${joint}.`);
  return {
    key: Math.random().toString(16).slice(2),
    active: true,
    measure: item.slice(0, indexName),
    joint,
    conditionOne: filterParseCondition(cond1),
    conditionTwo: cond2 ? filterParseCondition(cond2) : undefined
  };
}
