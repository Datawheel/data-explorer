import formUrlEncode from "form-urlencoded";
import {SERIAL_BOOLEAN} from "../enums";
import {asArray, filterMap} from "./array";
import {
  type CutItem,
  type DrilldownItem,
  type FilterItem,
  type MeasureItem,
  type QueryParams,
  buildCut,
  buildDrilldown,
  buildFilter,
  buildMeasure
} from "./structs";
import {keyBy} from "./transform";
import {isActiveCut, isActiveItem} from "./validation";

export interface SerializedQuery {
  cube: string;
  drilldowns: string[];
  measures: string[];
  booleans?: number;
  cuts?: string[];
  filters?: string[];
  locale?: string;
  preview?: 1;
  panel?: string;
}

/** */
export function serializePermalink(params: QueryParams, panel: string | null): string {
  const struct = serializeStateToSearchParams(params);
  struct.panel = panel || undefined;
  return formUrlEncode(struct, {
    ignorenull: true,
    skipIndex: false,
    sorted: true
  });
}

/** */
function serializeStateToSearchParams(query: QueryParams): SerializedQuery {
  const cuts = filterMap(Object.values(query.cuts), item =>
    isActiveCut(item) ? serializeCut(item) : null
  );

  const drilldowns = filterMap(Object.values(query.drilldowns), item =>
    isActiveItem(item) ? serializeDrilldown(item) : null
  );

  const filters = filterMap(Object.values(query.filters), item =>
    isActiveItem(item) ? serializeFilter(item) : null
  );

  const measures = filterMap(Object.values(query.measures), item =>
    isActiveItem(item) ? serializeMeasure(item) : null
  );

  const booleans = Object.keys(query.booleans).reduce((sum, key) => {
    const value = query.booleans[key] && SERIAL_BOOLEAN[key.toUpperCase()];
    return sum + (value || 0);
  }, 0);

  return {
    cube: query.cube,
    drilldowns,
    measures,
    booleans: booleans > 0 ? booleans : undefined,
    cuts: cuts.length > 0 ? cuts : undefined,
    filters: filters.length > 0 ? filters : undefined,
    locale: query.locale ? query.locale : undefined,
    panel: undefined,
    preview: query.isPreview ? 1 : undefined
  };

  /** */
  function serializeCut(item: CutItem): string {
    return [item.level].concat(item.members).join(",");
  }

  /** */
  function serializeDrilldown(item: DrilldownItem): string {
    return [item.level]
      .concat(filterMap(item.properties, prop => (isActiveItem(prop) ? prop.name : null)))
      .join(",");
  }

  /** */
  function serializeFilter(item: FilterItem): string {
    const conditions = filterMap([item.conditionOne, item.conditionTwo], cond =>
      cond ? `${cond[0]},${cond[2]}` : null
    );
    return `${item.measure},${conditions.join(`,${item.joint},`)}`;
  }

  /** */
  function serializeMeasure(item: MeasureItem) {
    return `${item.key}`;
  }
}

/** */
export function parseStateFromSearchParams(query: SerializedQuery): QueryParams {
  const getKey = i => i.key;

  const cuts: Record<string, CutItem> = Object.create(null);
  const drilldowns: Record<string, DrilldownItem> = Object.create(null);

  return {
    booleans: parseBooleans(query.booleans || 0),
    cube: query.cube,
    cuts: asArray(query.cuts).reduce(cutReducer, cuts),
    drilldowns: asArray(query.drilldowns).reduce(drilldownReducer, drilldowns),
    filters: keyBy(asArray(query.filters).map(parseFilter), getKey),
    isPreview: query.preview === 1,
    locale: query.locale,
    measures: keyBy(asArray(query.measures).map(parseMeasure), getKey),
    pagiLimit: 0,
    pagiOffset: 0,
    sortDir: "desc",
    sortKey: undefined
  };

  /** */
  function cutReducer(cuts: Record<string, CutItem>, item: string) {
    const [level, ...members] = item.split(",");
    const cut = buildCut({level, active: true, members});

    const matchingCut = Object.values(cuts).find(item => item.level === cut.level);
    if (matchingCut) {
      const memberSet = new Set([...matchingCut.members, ...cut.members]);
      cut.members = [...memberSet].sort();
    }
    cuts[cut.key] = cut;

    return cuts;
  }

  /** */
  function drilldownReducer(drilldowns: Record<string, DrilldownItem>, item: string) {
    const [level, ...props] = item.split(",");
    const properties = props.map(name => ({active: true, level, name}));
    const ddn = buildDrilldown({level, active: true, properties});
    drilldowns[ddn.key] = ddn;
    return drilldowns;
  }

  /** */
  function parseBooleans(item: number): Record<string, boolean> {
    const booleans: Record<string, boolean> = Object.create(null);

    Object.keys(SERIAL_BOOLEAN).forEach(key => {
      const value = item & SERIAL_BOOLEAN[key];
      if (value > 0) {
        booleans[key.toLowerCase()] = true;
      }
    });

    return booleans;
  }

  /** */
  function parseFilter(item: string): FilterItem {
    const [measure, ...comparisons] = item.split(",");
    // const conditionOne = comparisons.slice(1, 3);
    const conditionOne = comparisons.slice(0, 3);
    // const conditionTwo = comparisons.length > 2 ? comparisons.slice(4, 6) : undefined;
    const conditionTwo = comparisons.length > 2 ? comparisons.slice(3, 5) : undefined;
    //  ['gte', '500', 'and', 'gt', '0']
    // const joint = comparisons.length > 2 ? comparisons[3] : undefined;
    const joint = comparisons.length > 2 ? comparisons[2] : undefined;
    return buildFilter({
      active: true,
      measure,
      conditionOne: parseCondition(conditionOne),
      conditionTwo: conditionTwo ? parseCondition(conditionTwo) : undefined,
      joint
    });

    /** */
    function parseCondition(cond: string[]): FilterItem["conditionOne"] {
      const comparison = cond[0] as "gt";
      const inputtedValue = cond[1];
      const interpretedValue = Number.parseFloat(cond[1]);
      return [comparison, inputtedValue, interpretedValue];
    }
  }

  /** */
  function parseMeasure(item: string): MeasureItem {
    return buildMeasure({
      active: true,
      key: item,
      name: item
    });
  }
}
