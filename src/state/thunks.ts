import type {TesseractCube, TesseractFormat, TesseractMembersResponse} from "../api";
import {filterMap} from "../utils/array";
import {describeData} from "../utils/object";
import {applyQueryParams, buildDataRequest, extractQueryParams} from "../utils/query";
import {
  type AnyResultColumn,
  type QueryItem,
  buildCut,
  buildDrilldown,
  buildMeasure,
  buildQuery,
} from "../utils/structs";
import {keyBy} from "../utils/transform";
import type {FileDescriptor} from "../utils/types";
import {isValidQuery, noop} from "../utils/validation";
import {loadingActions} from "./loading";
import {
  queriesActions,
  selectCubeName,
  selectCurrentQueryItem,
  selectCurrentQueryParams,
  selectLocale,
  selectMeasureItems,
  selectQueryItems,
} from "./queries";
import {selectOlapCubeMap, serverActions} from "./server";
import type {ExplorerThunk} from "./store";
import {
  calcMaxMemberCount,
  hydrateDrilldownProperties,
  pickDefaultDrilldowns,
} from "./utils";

/**
 * Initiates a new download of the queried data by the current parameters.
 *
 * @param format - The format the user wants the data to be.
 * @returns A blob with the data contents, in the request format.
 */
export function willDownloadQuery(
  format: `${TesseractFormat}`,
): ExplorerThunk<Promise<FileDescriptor>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);

    if (!isValidQuery(params)) {
      return Promise.reject(new Error("The current query is not valid."));
    }

    const queryParams = {...params, pagiLimit: 0, pagiOffset: 0};
    return tesseract
      .fetchData({request: buildDataRequest(queryParams), format})
      .then(response => response.blob())
      .then(result => ({
        content: result[0],
        extension: format.replace(/json\w+/, "json"),
        name: `${params.cube}_${new Date().toISOString()}`,
      }));
  };
}

/**
 * Takes the current parameters, and queries the OLAP server for data with them.
 * The result is stored in QueryItem["result"].
 * This operation does not activate the Loading overlay in the UI; you must use
 * `willRequestQuery()` for that.
 */
type willExecuteQueryType = {
  limit?: number;
  offset?: number;
};

type APIResponse = Partial<{
  data: any;
  types: Record<string, AnyResultColumn>;
}>;

export function willExecuteQuery({limit, offset}: willExecuteQueryType = {}): ExplorerThunk<
  Promise<APIResponse>
> {
  return (dispatch, getState, {olapClient, previewLimit}) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);
    const endpoint = selectServerEndpoint(state);
    const isPrefetch = limit && offset;

    const allParams = isPrefetch ? {...params, pagiLimit: limit, pagiOffset: offset} : params;
    const {result: currentResult} = selectCurrentQueryItem(state);

    if (!isValidQuery(params)) return Promise.resolve();
    return olapClient.getCube(params.cube).then(async cube => {
      const query = applyQueryParams(cube.query, allParams, {previewLimit});

      const axios = olapClient.datasource.axiosInstance;
      const dataURL = query.toString("logiclayer").replace(olapClient.datasource.serverUrl, "");
      return Promise.all([
        axios({url: dataURL}).then(response => {
          return {
            data: response.data,
            headers: {...response.headers} as Record<string, string>,
            query,
            status: response.status
          };
        }),
        calcMaxMemberCount(query, allParams, dispatch).then(maxRows => {
          if (maxRows > 50000) {
            dispatch(loadingActions.setLoadingMessage({type: "HEAVY_QUERY", rows: maxRows}));
          }
        })
      ]).then(
        result => {
          const [aggregation] = result;
          const {data, headers, status} = aggregation;
          // !isPrefetch &&
          dispatch(
            queriesActions.updateResult({
              data: data?.data,
              types: data?.data.length
                ? describeData(cube.toJSON(), params, data?.data)
                : currentResult.types,
              headers: {...headers},
              sourceCall: query.toSource(),
              status: status || 500,
              url: query.toString(endpoint)
            })
          );

          return {
            data,
            types: data?.data.length ? describeData(cube.toJSON(), params, data?.data) : {}
          };
        },
        error => {
          dispatch(
            queriesActions.updateResult({
              data: [],
              types: {},
              error: error.message,
              status: error?.response?.status ?? 500,
              url: query.toString(endpoint)
            })
          );
        }
      );
    });
  };
}

/**
 * Requests the list of associated Members for a certain Level.
 *
 * @param level - The name of the Level for whom we want to retrieve members.
 * @returns The list of members for the requested level.
 */
export function willFetchMembers(
  level: string,
): ExplorerThunk<Promise<TesseractMembersResponse>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const cube = selectCubeName(state);
    const locale = selectLocale(state);

    return tesseract.fetchMembers({
      request: {cube, level, locale: locale.code},
    });
  };
}

/**
 * Checks the state of the current QueryParams and fills missing information.
 *
 * @param suggestedCube
 *   The cube to resolve the missing data from.
 */
export function willHydrateParams(suggestedCube?: string): ExplorerThunk<Promise<void>> {
  return (dispatch, getState, {olapClient}) => {
    const state = getState();
    const cubeMap = selectOlapCubeMap(state);
    const queries = selectQueryItems(state);

    const queryPromises = queries.map(queryItem => {
      const {params} = queryItem;
      const {cube: paramCube, measures: measureItems} = params;

      // if params.cube is "" (default), use the suggested cube
      // if was set from permalink/state, check if valid, else use suggested
      /* eslint-disable indent, operator-linebreak */
      const cubeName =
        paramCube && cubeMap[paramCube]
          ? paramCube
          : suggestedCube && cubeMap[suggestedCube]
          ? suggestedCube
          : /* else                              */ Object.keys(cubeMap)[0];
      /* eslint-enable */

      return olapClient.getCube(cubeName).then((cube): QueryItem => {
        const resolvedMeasures = cube.measures.map(measure =>
          buildMeasure(
            measureItems[measure.name] || {
              active: false,
              key: measure.name,
              name: measure.name
            }
          )
        );

        const resolvedDrilldowns = filterMap(
          Object.values(params.drilldowns),
          item => hydrateDrilldownProperties(cube, item) || null
        );

        return {
          ...queryItem,
          params: {
            ...params,
            locale: params.locale || state.explorerServer.localeOptions[0],
            cube: cubeName,
            drilldowns: keyBy(resolvedDrilldowns, item => item.key),
            measures: keyBy(resolvedMeasures, item => item.key)
          }
        };
      });
    });

    return Promise.all(queryPromises).then(resolvedQueries => {
      const queryMap = keyBy(resolvedQueries, i => i.key);
      dispatch(queriesActions.resetQueries(queryMap));
    });
  };
}

/**
 * Parses a query URL into a olap-client Query object, then into a QueryParam
 * object, and inyects it into a new QueryItem in the UI.
 */
export function willParseQueryUrl(url: string | URL): ExplorerThunk<Promise<void>> {
  return (dispatch, getState, {olapClient}) =>
    olapClient.parseQueryURL(url.toString(), {anyServer: true}).then(query => {
      extractQueryParams(query);
      const queryItem = buildQuery({
        params: extractQueryParams(query)
      });
      dispatch(queriesActions.updateQuery(queryItem));
      dispatch(queriesActions.selectQuery(queryItem.key));
    });
}

/**
 * Performs a full replacement of the cubes stored in the state with fresh data
 * from the server.
 */
export function willReloadCubes(): ExplorerThunk<Promise<{[k: string]: TesseractCube}>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const locale = selectLocale(state);

    return tesseract.fetchSchema({locale: locale.code}).then(schema => {
      const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
      const cubeMap = keyBy(cubes, i => i.name);
      dispatch(serverActions.updateServer({cubeMap}));
      return cubeMap;
    });
  };
}

/**
 * Executes the full Query request procedure, including the calls to activate
 * the loading overlay.
 */
export function willRequestQuery(): ExplorerThunk<Promise<void>> {
  return (dispatch, getState) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);
    if (!isValidQuery(params)) return Promise.resolve();
    dispatch(loadingActions.setLoadingState("FETCHING"));
    return dispatch(willExecuteQuery()).then(
      () => {
        dispatch(loadingActions.setLoadingState("SUCCESS"));
      },
      error => {
        dispatch(loadingActions.setLoadingState("FAILURE", error.message));
      }
    );
  };
}

/**
 * Changes the current cube and updates related state
 * If the new cube contains a measure with the same name as a measure in the
 * previous cube, keep its state.
 *
 * @param cubeName
 *   The name of the cube we intend to switch to.
 */
export function willSetCube(cubeName: string): ExplorerThunk<Promise<void>> {
  return (dispatch, getState) => {
    const state = getState();

    const cubeMap = selectOlapCubeMap(state);
    const nextCube = cubeMap[cubeName];
    if (!nextCube) return Promise.resolve();

    const currMeasures = selectMeasureItems(state);
    const measureStatus = Object.fromEntries(
      currMeasures.map(item => [item.name, item.active]),
    );
    const nextMeasures = nextCube.measures.map((measure, index) =>
      buildMeasure({
        active: measureStatus[measure.name] || !index,
        key: measure.name,
        name: measure.name,
      }),
    );

    const nextDrilldowns = pickDefaultDrilldowns(nextCube.dimensions).map(level =>
      buildDrilldown({...level, active: true}),
    );

    dispatch(
      queriesActions.updateCube({
        cube: nextCube.name,
        measures: keyBy(nextMeasures, item => item.key),
        drilldowns: keyBy(nextDrilldowns, item => item.key),
      }),
    );

    const promises = nextDrilldowns.map(dd => {
      return dispatch(willFetchMembers(dd.level)).then(levelMeta => {
        dispatch(
          queriesActions.updateDrilldown({
            ...dd,
            memberCount: levelMeta.members.length,
            members: levelMeta.members,
          }),
        );
        dispatch(queriesActions.updateCut(buildCut({...dd, active: false})));
      });
    });

    return Promise.all(promises).then(noop);
  };
}

/**
 * Sets the necessary info for the client instance to be able to connect to the
 * server, then loads the base data from its schema.
 */
export function willSetupClient(
  baseURL: string,
  defaultLocale?: string,
  requestConfig?: RequestInit,
): ExplorerThunk<Promise<{[k: string]: TesseractCube}>> {
  return (dispatch, getState, {tesseract}) => {
    tesseract.baseURL = baseURL;
    Object.assign(tesseract.requestConfig, requestConfig || {headers: new Headers()});

    return tesseract.fetchSchema({locale: defaultLocale}).then(
      schema => {
        const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
        const cubeMap = keyBy(cubes, "name");
        dispatch(
          serverActions.updateServer({
            cubeMap,
            locale: defaultLocale || schema.default_locale,
            localeOptions: schema.locales,
            online: true,
            url: baseURL,
          }),
        );
        return cubeMap;
      },
      error => {
        dispatch(serverActions.updateServer({online: false, url: baseURL}));
        throw error;
      },
    );
  };
}
