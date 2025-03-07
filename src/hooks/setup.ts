import {useEffect} from "react";
import {decodeUrlFromBase64} from "../utils/string";
import {type QueryItem, buildCut, buildQuery} from "../utils/structs";
import {hasProperty, isValidQuery} from "../utils/validation";
import {parsePermalink} from "./permalink";
import {useSettings} from "./settings";
import {keyBy} from "../utils/transform";

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

        let promisesData: Promise<void> | undefined = undefined;
        const cubeName = search.get("cube");

        if (cubeName) {
          // Search params are a QueryItem permalink
          query = parsePermalink(cubeMap[cubeName], search);

          const promises = Object.values(query.params.drilldowns).map(dd => {
            return actions
              .willFetchMembers(dd.level, query?.params.locale, cubeName)
              .then(levelMeta => {
                const cut = buildCut({...dd, active: false});
                return {
                  drilldown: {
                    ...dd,
                    members: levelMeta.members
                  },
                  cut
                };
              });
          });

          query = isValidQuery(query.params) ? query : undefined;

          promisesData = Promise.all(promises).then(data => {
            if (query) {
              const drilldowns = data.map(item => item.drilldown);
              const cuts = data.map(item => item.cut);
              query.params.drilldowns = keyBy(drilldowns, "key");

              // Merge existing cuts with new cuts, preserving existing ones
              const existingCuts = keyBy(
                Object.values(query.params.cuts || {}).map(c => ({...c, key: c.level})),
                "key"
              );
              const newCuts = keyBy(cuts, "key");
              query.params.cuts = {...newCuts, ...existingCuts};

              query = isValidQuery(query.params) ? query : undefined;
            }
          });
        } else if (isValidQuery(historyState)) {
          query = buildQuery({params: {...historyState, pagiLimit: paginationConfig.defaultLimit}});
        }

        if (!query || !hasProperty(cubeMap, query.params.cube)) {
          return defaultCube && hasProperty(cubeMap, defaultCube)
            ? defaultCube
            : Object.keys(cubeMap)[0];
        }

        if (query && promisesData) {
          return promisesData.then(() => {
            if (query) {
              query.params.locale = query.params.locale || defaultLocale;
              actions.resetQueries({[query.key]: query});
            }
          });
        }

        query.params.locale = query.params.locale || defaultLocale;
        actions.resetQueries({[query.key]: query});
      })
      .then(cube => actions.willHydrateParams(typeof cube === "string" ? cube : undefined))
      .then(
        () => actions.setLoadingState("SUCCESS"),
        error => {
          console.dir("There was an error during setup:", error);
          actions.setLoadingState("FAILURE", error.message);
        }
      );
  }, [serverURL, serverConfig, defaultLocale, defaultCube]);
}
