export enum Aggregator {
  AVERAGE = "Average",
  COUNT = "Count",
  MAX = "Max",
  MEDIAN = "Median",
  MIN = "Min",
  MODE = "Mode",
  SUM = "Sum",
  BASICGROUPEDMEDIAN = "BasicGroupedMedian",
  CALCULATEDMOE = "CalculatedMoe",
  QUANTILE = "Quantile",
  REPLICATEWEIGHTMOE = "ReplicateWeightMoe",
  WEIGHTEDAVERAGE = "WeightedAverage",
  WEIGHTEDAVERAGEMOE = "WeightedAverageMoe",
  WEIGHTEDSUM = "WeightedSum",
  DISTINCTCOUNT = "DistinctCount",
}

export enum ColumnType {
  BOOLEAN = "bool",
  DATE = "date",
  TIME = "time",
  DATETIME = "dttm",
  TIMESTAMP = "stmp",
  FLOAT32 = "f32",
  FLOAT64 = "f64",
  INT8 = "i8",
  INT16 = "i16",
  INT32 = "i32",
  INT64 = "i64",
  INT128 = "i128",
  UINT8 = "u8",
  UINT16 = "u16",
  UINT32 = "u32",
  UINT64 = "u64",
  UINT128 = "u128",
  STRING = "str",
}

export enum Comparison {
  "!=" = "neq",
  "<" = "lt",
  "<=" = "lte",
  "<>" = "neq",
  "=" = "eq",
  ">" = "gt",
  ">=" = "gte",
  eq = "eq",
  EQ = "eq",
  gt = "gt",
  GT = "gt",
  gte = "gte",
  GTE = "gte",
  lt = "lt",
  LT = "lt",
  lte = "lte",
  LTE = "lte",
  NEQ = "neq",
  neq = "neq",
}

export enum DimensionType {
  GEO = "geo",
  STANDARD = "standard",
  TIME = "time",
}

export enum Format {
  csv = "csv",
  // jsonarrays = "jsonarrays",
  jsonrecords = "jsonrecords",
  parquet = "parquet",
  tsv = "tsv",
  xlsx = "xlsx",
}

export enum Order {
  asc = "asc",
  desc = "desc",
}
