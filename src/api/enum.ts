export enum Aggregator {
  avg = "avg",
  basic_grouped_median = "basic_grouped_median",
  count = "count",
  distinct_count = "distinct_count",
  max = "max",
  median = "median",
  min = "min",
  mode = "mode",
  moe = "moe",
  quantile = "quantile",
  replicate_weight_moe = "replicate_weight_moe",
  sum = "sum",
  weighted_average_moe = "weighted_average_moe",
  weighted_avg = "weighted_avg",
  weighted_sum = "weighted_sum",
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
  geo = "geo",
  standard = "standard",
  time = "time",
}

export enum Format {
  csv = "csv",
  jsonarrays = "jsonarrays",
  jsonrecords = "jsonrecords",
  parquet = "parquet",
  tsv = "tsv",
  xlsx = "xlsx",
}

export enum Order {
  asc = "asc",
  desc = "desc",
}
