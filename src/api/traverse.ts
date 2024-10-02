import type {
  TesseractCube,
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
  TesseractProperty,
} from "./tesseract/schema";

export function mapCubeEntities(cube: TesseractCube): {
  [k: string]: TesseractMeasure | TesseractLevel | TesseractProperty;
} {
  return {
    ...mapLevels(cube),
    ...mapProperties(cube),
    ...mapAllMeasures(cube),
  };
}

export function mapDimensionHierarchyLevels(cube: TesseractCube): {
  [k: string]: [TesseractDimension, TesseractHierarchy, TesseractLevel];
} {
  return Object.fromEntries(
    Array.from(yieldDimensionHierarchyLevels(cube), tuple => [tuple[2].name, tuple]),
  );
}

/**
 * Creates a map object to reference a level name with its parent entities.
 */
export function mapLevels(cube: TesseractCube): {[k: string]: TesseractLevel} {
  return Object.fromEntries(
    Array.from(yieldDimensionHierarchyLevels(cube), tuple => [tuple[2].name, tuple[2]]),
  );
}

export function mapProperties(cube: TesseractCube): {[k: string]: TesseractProperty} {
  return Object.fromEntries(
    Object.values(mapLevels(cube)).flatMap(level =>
      level.properties.map(prop => [prop.name, prop]),
    ),
  );
}

export function mapAllMeasures(cube: TesseractCube): {
  [k: string]: TesseractMeasure;
} {
  return Object.fromEntries(
    Array.from(yieldAllMeasures(cube), item => [item.name, item]),
  );
}

export function* yieldDimensionHierarchyLevels(
  cube: TesseractCube,
): Iterable<[TesseractDimension, TesseractHierarchy, TesseractLevel]> {
  for (const dimension of cube.dimensions) {
    for (const hierarchy of dimension.hierarchies) {
      for (const level of hierarchy.levels) {
        yield [dimension, hierarchy, level];
      }
    }
  }
}

export function* yieldAllMeasures(cube: TesseractCube): Iterable<TesseractMeasure> {
  for (const measure of cube.measures) {
    yield measure;
    yield* measure.attached;
  }
}
