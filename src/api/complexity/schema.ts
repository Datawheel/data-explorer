import type {TesseractCube, TesseractSchema} from "../tesseract/schema";

export type {TesseractCube, TesseractSchema};

export interface CommonRequest {
  alias?: Record<string, string>;
  filter?: Record<string, string>;
  locale?: string;
}

export interface RcaRequest extends CommonRequest {
  cube: string;
  activity: string;
  location: string;
  measure: string;
  cuts?: Record<string, string>;
  parents?: boolean;
  threshold?: string[];
}

export interface ComplexityRequest extends RcaRequest {
  ascending?: boolean;
  cutoff?: number;
  iterations?: number;
  rank?: boolean;
}

export interface RelatednessRequest extends RcaRequest {
  ascending?: boolean;
  cutoff?: number;
  rank?: boolean;
}

export interface OpportunityRequest extends RcaRequest {
  ascending?: boolean;
  cutoff?: number;
  rank?: boolean;
}

export interface GiniRequest extends RcaRequest {
  gini_cube: string;
  gini_location: string;
  gini_measure: string;
  ascending?: boolean;
  cutoff?: number;
  rank?: boolean;
}

export interface EmissionsRequest extends RcaRequest {
  emissions_cube: string;
  emissions_location: string;
  emissions_measure: string;
  ascending?: boolean;
  cutoff?: number;
  rank?: boolean;
}
