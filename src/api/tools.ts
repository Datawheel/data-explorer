import {filterMap} from "../utils/array";

export function toPlainObject(obj): Record<string, string> {
  return Object.fromEntries(
    filterMap(Object.entries(obj), entry => {
      const value = stringify(entry[1]);
      return !value ? null : [entry[0], value];
    }),
  );

  function stringify(obj: unknown): string {
    if (obj == null || typeof obj === "function") {
      return "";
    }
    if (Array.isArray(obj)) {
      return obj.map(stringify).join(",");
    }
    if (typeof obj === "object") {
      return new URLSearchParams(toPlainObject(obj)).toString();
    }
    return `${obj}`;
  }
}

export function httpFetch(url: string | URL, params: RequestInit): Promise<Response> {
  return fetch(url, params).then(response => {
    if (!response.ok) {
      return response.json().then(content => {
        console.debug("CONTENT", content);
        if (response.status === 500) {
          throw new Error("");
        }
        throw new Error(`Request failed with error code ${response.status}`);
      });
    }
    return response;
  });
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
