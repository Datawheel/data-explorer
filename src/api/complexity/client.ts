import {httpFetch, toPlainObject} from "../tools";
import type {
  CommonRequest,
  ComplexityRequest,
  EmissionsRequest,
  GiniRequest,
  OpportunityRequest,
  RcaRequest,
  RelatednessRequest,
  TesseractCube,
  TesseractSchema,
} from "./schema";

export enum Format {
  csv = "csv",
  jsonarrays = "jsonarrays",
  jsonrecords = "jsonrecords",
  parquet = "parquet",
  tsv = "tsv",
  xlsx = "xlsx",
}

export class ComplexityModuleClient {
  auth: string;
  baseURL: string;

  static format = Format;

  constructor(baseURL: string, auth: string) {
    this.auth = auth;
    this.baseURL = baseURL;
  }

  fetchSchema(params: {locale?: string}): Promise<TesseractSchema> {
    const search = new URLSearchParams(toPlainObject(params));
    return httpFetch({
      auth: this.auth,
      url: new URL(`cubes?${search}`, this.baseURL),
    });
  }

  fetchCube(cubeName: string, params: {locale?: string}): Promise<TesseractCube> {
    const search = new URLSearchParams(toPlainObject(params));
    return httpFetch({
      auth: this.auth,
      url: new URL(`cubes/${cubeName}?${search}`, this.baseURL),
    });
  }

  fetchData(type: "rca", params: RcaRequest, format: Format);
  fetchData(type: "eci", params: ComplexityRequest, format: Format);
  fetchData(type: "pci", params: ComplexityRequest, format: Format);
  fetchData(type: "relatedness", params: RelatednessRequest, format: Format);
  fetchData(type: "opportunity_gain", params: OpportunityRequest, format: Format);
  fetchData(type: "pgi", params: GiniRequest, format: Format);
  fetchData(type: "peii", params: EmissionsRequest, format: Format);
  fetchData(type: string, params: CommonRequest, format: Format) {
    const search = new URLSearchParams(toPlainObject(params));
    return httpFetch({
      auth: this.auth,
      url: new URL(`${type}.${format}?${search}`, this.baseURL),
    });
  }
}
