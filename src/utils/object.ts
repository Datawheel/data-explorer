import type {TesseractCube} from "../api";
import {mapCubeEntities} from "../api/traverse";
import {filterMap} from "./array";
import {getCaption, parseNumeric} from "./string";
import type {AnyResultColumn, QueryParams} from "./structs";
import type {Annotated} from "./types";
import {hasProperty} from "./validation";

/**
 * Wraps `Object.keys` for reusability.
 */
export function getKeys<T>(map: { [s: string]: T }): string[] {
  return Object.keys(map);
}

/**
 * Wraps `Object.values` for reusability.
 */
export function getValues<T>(map: { [s: string]: T }): T[] {
  return Object.values(map);
}

/**
 * Safe method to check if an object contains a property.
 * @deprecated
 */
export const hasOwnProperty = hasProperty;

/**
 * Parse and convert order value from an schema object
 * (that supports annotations) to an integer value.
 * If null return a big number: 99
 */
export function getOrderValue<T extends Annotated>(schemaObject: T) {
  const value = schemaObject.annotations.order || "NaN";
  return parseNumeric(value, 99);
}

/**
 * Checks the structure of an array of data and returns an object that describes
 * the types, ranges and values in it.
 */
export function describeData(
  cube: TesseractCube,
  params: QueryParams,
  data: Record<string, unknown>[],
): Record<string, AnyResultColumn> {
  const {locale} = params;
  const entityMap = mapCubeEntities(cube);
  const entityFinder = (name: string) => {
    const nameWoId = name.replace(/^ID\s|\sID$/, "");
    return entityMap[name] || entityMap[nameWoId];
  };

  return Object.fromEntries(
    filterMap(Object.keys(data[0] || {}), column => {
      const entity = entityFinder(column);
      if (!entity) return null;
      const typeSet = new Set(data.map(item => typeof item[column]));
      const valueType =
        typeSet.size === 1
          ? typeSet.has("number")
            ? "number"
            : typeSet.has("boolean")
              ? "boolean"
              : /* else */ "string"
          : typeSet.has("number")
            ? "number"
            : "string";
      const isId = column !== entity.name;
      const entityType = hasProperty(entity, "aggregator")
        ? "measure"
        : hasProperty(entity, "depth")
          ? "level"
          : "property";
      return [
        column,
        {
          label: column,
          localeLabel: getCaption(entity, locale) + (isId ? " ID" : "") || column,
          entity,
          entityType,
          isId,
          range: valueType === "number" ? getDomain(data, column) : undefined,
          valueType,
        } as AnyResultColumn,
      ];
    }),
  );
}

/**
 * Calculates the range of the values for a specific key in a dataset.
 * The array needs to be sliced because the amount of acceptable arguments
 * to the Math.max/Math.min functions is limited, and varies across browsers.
 */
function getDomain(data: Record<string, unknown>[], column: string): [number, number] {
  const batch = 20000;
  const iterations = Math.ceil(data.length / batch);
  let [min, max] = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

  for (let index = 0; index < iterations; index++) {
    const slice = data.slice(index * batch, (index + 1) * batch);
    const values = slice.map(item => item[column] as number);
    min = Math.min(min, ...values);
    max = Math.max(max, ...values);
  }

  return [min, max];
}
