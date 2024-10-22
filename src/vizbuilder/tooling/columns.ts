import type {
  Column,
  LevelColumn,
  MeasureColumn,
  PropertyColumn,
} from "@datawheel/vizbuilder";
import type {TesseractCube} from "../../api/tesseract/schema";
import {yieldLevels, yieldMeasures, yieldProperties} from "../../api/traverse";
import {next} from "../../utils/array";
import {getAnnotation} from "../../utils/string";

export function buildColumn(
  cube: TesseractCube,
  name: string,
  columns: string[],
): Column {
  const nameWithoutID = name.replace(/\sID$/, "");
  const nameWithID = `${nameWithoutID} ID`;

  const maybeMeasure = next(yieldMeasures(cube), item => item[0].name === name);
  if (maybeMeasure) {
    const [measure, parentMeasure] = maybeMeasure;
    return {
      name,
      type: "measure",
      measure,
      parentMeasure,
      parentRelationship: undefined, // TODO
    } as MeasureColumn;
  }

  const maybeLevel = next(
    yieldLevels(cube),
    item => item[0].name === nameWithoutID || item[0].name === nameWithID,
  );
  if (maybeLevel) {
    const [level, hierarchy, dimension] = maybeLevel;
    const hasID = columns.includes(nameWithID);
    return {
      name,
      type: "level",
      dimension,
      hierarchy,
      level,
      isID: !hasID || name === nameWithID,
      hasID,
    } as LevelColumn;
  }

  const maybeProperty = next(yieldProperties(cube), item => item[0].name === name);
  if (maybeProperty) {
    const [property, level, hierarchy, dimension] = maybeProperty;
    return {
      name,
      type: "property",
      dimension,
      hierarchy,
      level,
      property,
    } as PropertyColumn;
  }

  throw new Error(`Missing entity in cube '${cube.name}': ${nameWithoutID}`);
}

/**
 * Retrieves the main entity for the Column.
 */
export function getColumnEntity(column: Column) {
  if (column.type === "measure") return column.measure;
  if (column.type === "level") return column.level;
  if (column.type === "property") return column.property;
  throw new Error("Invalid column object");
}

/**
 * Retrieves the localized caption from a Column.
 */
export function getCaption(column: Column, locale = "en"): string {
  const item = getColumnEntity(column);
  return getAnnotation(item, "caption", locale) || item.caption || item.name;
}
