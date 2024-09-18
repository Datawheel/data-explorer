import formUrlDecode from "form-urldecoded";
import {useEffect} from "react";
import {hasOwnProperty} from "../utils/object";
import {parseStateFromSearchParams} from "../utils/permalink";
import {decodeUrlFromBase64} from "../utils/string";
import {type QueryItem, buildQuery, buildQueryParams} from "../utils/structs";
import {isValidQuery} from "../utils/validation";
import {useSettings} from "./settings";

/**
 * Keeps in sync the internal datasources with the setup parameters.
 */
export function useSetup(
  serverURL: string,
  serverConfig: RequestInit,
  defaultLocale?: string,
  defaultCube?: string,
) {
  const {actions} = useSettings();

  // Initialize the internal state, from permalink, history API, or default.
  useEffect(() => {
    actions.resetServer();
    actions.resetAllParams({});
    actions.setLoadingState("FETCHING");

    actions
      .willSetupClient(serverURL, defaultLocale, serverConfig)
      .then(cubeMap => {
        let query: QueryItem | undefined;
        const searchString = window.location.search;
        const historyState = window.history.state;

        if (searchString) {
          // The current URL contains search params, parse them
          // We need to decode them using this function, as reconstructs arrays
          /** @type {import("../utils/permalink").SerializedQuery | {query: string}} */
          const searchObject = formUrlDecode(searchString);

          if ("query" in searchObject) {
            // Search params are a base64-encoded OLAP server URL
            const decodedURL = decodeUrlFromBase64(searchObject.query);
            const url = new URL(decodedURL);
            return actions
              .willParseQueryUrl(url)
              .then(() => actions.willHydrateParams())
              .then(() => actions.willExecuteQuery());
          }
          // else, search params are a Explorer state permalink
          const locationState = parseStateFromSearchParams(searchObject);
          query = isValidQuery(locationState)
            ? buildQuery({
                panel: searchObject.panel,
                params: buildQueryParams({...locationState}),
              })
            : undefined;
        } else if (isValidQuery(historyState)) {
          query = buildQuery({params: {...historyState}});
        }

        if (!query || !hasOwnProperty(cubeMap, query.params.cube)) {
          const cube =
            defaultCube && hasOwnProperty(cubeMap, defaultCube)
              ? defaultCube
              : Object.keys(cubeMap)[0];
          return actions.willHydrateParams(cube);
        }

        query.params.locale = query.params.locale || defaultLocale;
        actions.resetQueries({[query.key]: query});
        return actions.willHydrateParams();
        // .then(() => actions.willExecuteQuery());
      })
      .then(
        () => {
          actions.setLoadingState("SUCCESS");
        },
        error => {
          console.dir("There was an error during setup:", error);
          actions.setLoadingState("FAILURE", error.message);
        },
      );
  }, [serverURL, serverConfig, defaultLocale, defaultCube]);
}
