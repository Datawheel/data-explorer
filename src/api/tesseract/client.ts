import {httpFetch, toPlainObject} from "../tools";
import type {
  TesseractCube,
  TesseractDataRequest,
  TesseractMembersRequest,
  TesseractMembersResponse,
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

export class TesseractModuleClient {
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

  fetchData(params: TesseractDataRequest, format: Format) {
    const search = new URLSearchParams(toPlainObject(params));
    return httpFetch({
      auth: this.auth,
      url: new URL(`data.${format}?${search}`, this.baseURL),
    });
  }

  fetchMembers(params: TesseractMembersRequest): Promise<TesseractMembersResponse> {
    const search = new URLSearchParams(toPlainObject(params.search));
    return httpFetch({
      auth: this.auth,
      url: new URL(`members?${search}`, this.baseURL),
    });
  }
}
