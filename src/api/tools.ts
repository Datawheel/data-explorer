export function toPlainObject(obj): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(entry => {
      return [entry[0], stringify(entry[1])];
    }),
  );

  function stringify(obj: unknown): string {
    if (obj == null) {
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

export function httpFetch<R>(params: {
  auth: string;
  method?: "GET" | "POST" | "HEAD" | "PUT";
  url: string | URL;
  signal?: AbortSignal;
}): Promise<R> {
  return fetch(params.url, {
    headers: {
      Authorization: params.auth,
    },
    method: params.method || "GET",
    signal: params.signal,
  }).then(response => {
    return response.ok
      ? response.json()
      : response.json().then(content => httpThrow(response, content));
  });
}

export function httpThrow(response: Response, content: unknown) {
  if (response.status === 500) {
    throw new Error("");
  }
  throw new Error(`Request failed with error code ${response.status}`);
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
