import type {Format} from "../enum";
import {httpFetch, toPlainObject} from "../tools";
import type {
  CommonRequest,
  ComplexityRequest,
  ComplexityStatus,
  EmissionsRequest,
  GiniRequest,
  OpportunityRequest,
  RcaRequest,
  RelatednessRequest,
  TesseractCube,
  TesseractSchema,
} from "./schema";

export {Format as ComplexityFormat} from "../enum";

export class ComplexityModuleClient {
  baseURL: string;
  requestConfig: RequestInit;

  constructor(baseURL?: string, config?: RequestInit) {
    this.baseURL = baseURL || "";
    this.requestConfig = config || {headers: new Headers()};
  }

  fetchStatus(params: {
    signal?: AbortSignal;
  }): Promise<ComplexityStatus> {
    return httpFetch(new URL("", this.baseURL), {
      ...this.requestConfig,
      signal: params.signal,
    }).then(response => response.json() as Promise<ComplexityStatus>);
  }

  fetchSchema(params: {locale?: string; signal?: AbortSignal}): Promise<TesseractSchema> {
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

  fetchData(
    type: "rca",
    params: {request: RcaRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "eci",
    params: {request: ComplexityRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "pci",
    params: {request: ComplexityRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "relatedness",
    params: {request: RelatednessRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "opportunity_gain",
    params: {request: OpportunityRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "pgi",
    params: {request: GiniRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: "peii",
    params: {request: EmissionsRequest; format: Format; signal?: AbortSignal},
  );
  fetchData(
    type: string,
    params: {request: CommonRequest; format: Format; signal?: AbortSignal},
  ) {
    const {format, request, signal} = params;
    const search = new URLSearchParams(toPlainObject(request));

    return httpFetch(new URL(`${type}.${format}?${search}`, this.baseURL), {
      ...this.requestConfig,
      signal,
    });
  }
}
