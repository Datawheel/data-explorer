import type {Format} from "../enum";
import {httpFetch, toPlainObject} from "../tools";
import type {
  TesseractCube,
  TesseractDataRequest,
  TesseractMembersRequest,
  TesseractMembersResponse,
  TesseractSchema,
  TesseractStatus,
} from "./schema";

export type TesseractFormat = Format;

export class TesseractModuleClient {
  baseURL: string;
  requestConfig: RequestInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.requestConfig = {headers: new Headers()};
  }

  fetchStatus(params: {
    signal?: AbortSignal;
  }): Promise<TesseractStatus> {
    return httpFetch(new URL("", this.baseURL), {
      ...this.requestConfig,
      signal: params.signal,
    }).then(response => response.json() as Promise<TesseractStatus>);
  }

  fetchSchema(params: {
    locale?: string;
    signal?: AbortSignal;
  }): Promise<TesseractSchema> {
    const {signal, ...request} = params;
    const search = new URLSearchParams(toPlainObject(request));

    return httpFetch(new URL(`cubes?${search}`, this.baseURL), {
      ...this.requestConfig,
      signal,
    }).then(response => response.json() as Promise<TesseractSchema>);
  }

  fetchCube(params: {
    cube: string;
    locale?: string;
    signal?: AbortSignal;
  }): Promise<TesseractCube> {
    const {cube, signal, ...request} = params;
    const search = new URLSearchParams(toPlainObject(request));

    return httpFetch(new URL(`cubes/${cube}?${search}`, this.baseURL), {
      ...this.requestConfig,
      signal,
    }).then(response => response.json() as Promise<TesseractCube>);
  }

  fetchData(params: {
    request: TesseractDataRequest;
    format: `${Format}`;
    signal?: AbortSignal;
  }): Promise<Response> {
    const {format, request, signal} = params;
    const search = new URLSearchParams(toPlainObject(request));

    return httpFetch(new URL(`data.${format}?${search}`, this.baseURL), {
      ...this.requestConfig,
      signal,
    });
  }

  fetchMembers(params: {
    request: TesseractMembersRequest;
    signal?: AbortSignal;
  }): Promise<TesseractMembersResponse> {
    const {request, signal} = params;
    const search = new URLSearchParams(toPlainObject(request));

    return httpFetch(new URL(`members?${search}`, this.baseURL), {
      ...this.requestConfig,
      signal,
    }).then(response => response.json() as Promise<TesseractMembersResponse>);
  }
}
