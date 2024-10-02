import {useEffect} from "react";
import {decodeUrlFromBase64} from "../utils/string";
import {type QueryItem, buildQuery} from "../utils/structs";
import {hasProperty, isValidQuery} from "../utils/validation";
import {parsePermalink} from "./permalink";
import {useSettings} from "./settings";

/**
 * Keeps in sync the internal datasources with the setup parameters.
 */
export function useSetup(
  serverURL: string,
  serverConfig: RequestInit,
  defaultLocale?: string,
  defaultCube?: string
) {
  const {actions, paginationConfig} = useSettings();
  // Initialize the internal state, from permalink, history API, or default.
  useEffect(() => {
    actions.resetServer();
    actions.resetAllParams({});
    actions.setLoadingState("FETCHING");
    actions
      .willSetupClient(serverURL, defaultLocale, serverConfig)
      .then(cubeMap => {
        const search = new URLSearchParams(window.location.search);
        const historyState = window.history.state;
        let query: QueryItem | undefined;
        const base64 = search.get("query");
        if (base64) {
          // Search params are a base64-encoded OLAP server URL
          const decodedURL = decodeUrlFromBase64(base64);
          actions.willParseQueryUrl(decodedURL);
          return;
        }

        const cubeName = search.get("cube");
        if (cubeName) {
          // Search params are a QueryItem permalink
          query = parsePermalink(cubeMap[cubeName], search);
          query = isValidQuery(query.params) ? query : undefined;
        } else if (isValidQuery(historyState)) {
          query = buildQuery({params: {...historyState, pagiLimit: paginationConfig.defaultLimit}});
        }

        if (!query || !hasProperty(cubeMap, query.params.cube)) {
          return defaultCube && hasProperty(cubeMap, defaultCube)
            ? defaultCube
            : Object.keys(cubeMap)[0];
        }

        if (query) {
          query.params.locale = query.params.locale || defaultLocale;
          actions.resetQueries({[query.key]: query});
        }
      })
      .then(actions.willHydrateParams)
      .then(
        () => actions.setLoadingState("SUCCESS"),
        error => {
          console.dir("There was an error during setup:", error);
          actions.setLoadingState("FAILURE", error.message);
        }
      );
  }, [serverURL, serverConfig, defaultLocale, defaultCube]);
}