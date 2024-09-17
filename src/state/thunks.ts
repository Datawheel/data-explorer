import type {
  TesseractCube,
  TesseractDataRequest,
  TesseractDataResponse,
  TesseractFormat,
  TesseractMembersResponse,
} from "../api";
import {filterMap} from "../utils/array";
import {describeData} from "../utils/object";
import {buildDataRequest, extractQueryParams} from "../utils/query";
import {type QueryItem, buildMeasure, buildQuery} from "../utils/structs";
import {keyBy} from "../utils/transform";
import type {FileDescriptor} from "../utils/types";
import {isValidQuery} from "../utils/validation";
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
import {hydrateDrilldownProperties} from "./utils";

/**
 * Initiates a new download of the queried data by the current parameters.
 *
 * @param format
 *   The format the user wants the data to be downloaded.
 */
export function willDownloadQuery(
  format: TesseractFormat,
): ExplorerThunk<Promise<FileDescriptor>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);

    if (!isValidQuery(params)) {
      return Promise.reject(new Error("The current query is not valid."));
    }

    return tesseract
      .fetchData({request: buildDataRequest(params), format})
      .then(response => response.blob())
      .then(blob => ({
        content: blob,
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
export function willExecuteQuery(
  params: {limit?: number; offset?: number} = {},
): ExplorerThunk<Promise<void>> {
  const {limit = 0, offset = 0} = params;

  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);
    if (!isValidQuery(params)) return Promise.resolve();

    const cubeMap = selectOlapCubeMap(state);
    const {result: currentResult} = selectCurrentQueryItem(state);

    const cube = cubeMap[params.cube];
    const isPrefetch = limit && offset;
    const request = buildDataRequest(params);
    if (isPrefetch) {
      request.limit = `${limit},${offset}`;
    }

    return tesseract.fetchData({request, format: "jsonrecords"}).then(
      response =>
        response.json().then((result: TesseractDataResponse) => {
          const {columns, data, page} = result;
          if (!isPrefetch) {
            dispatch(
              queriesActions.updateResult({
                data,
                types:
                  data.length > 0
                    ? describeData(cube, params, data)
                    : currentResult.types,
                headers: {...response.headers},
                status: response.status || 500,
                url: response.url,
              }),
            );
          }
          return {
            data,
            types:
              data.length > 0 ? describeData(cube, params, data) : currentResult.types,
          };
        }),
      error => {
        dispatch(
          queriesActions.updateResult({
            data: [],
            types: {},
            error: error.message,
            status: error?.response?.status ?? 500,
            url: "",
          }),
        );
      },
    );
  };
}

/**
 * Requests the list of associated Members for a certain Level.
 *
 * @param levelName
 *   The descriptor to the Level for whom we want to retrieve members.
 */
export function willFetchMembers(
  levelName: string,
): ExplorerThunk<Promise<TesseractMembersResponse>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const cubeName = selectCubeName(state);
    const locale = selectLocale(state);

    return tesseract.fetchMembers({
      request: {cube: cubeName, level: levelName, locale: locale.code},
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
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const cubeMap = selectOlapCubeMap(state);
    const queries = selectQueryItems(state);

    const queryPromises = queries.map(queryItem => {
      const {params} = queryItem;
      const {cube: paramCube, measures: measureItems} = params;

      // if params.cube is "" (default), use the suggested cube
      // if was set from permalink/state, check if valid, else use suggested
      const cubeName =
        paramCube && cubeMap[paramCube]
          ? paramCube
          : suggestedCube && cubeMap[suggestedCube]
            ? suggestedCube
            : Object.keys(cubeMap)[0];

      return tesseract.fetchCube({cube: cubeName}).then((cube): QueryItem => {
        const resolvedMeasures = cube.measures.map(measure =>
          buildMeasure(
            measureItems[measure.name] || {
              active: false,
              key: measure.name,
              name: measure.name,
            },
          ),
        );

        const resolvedDrilldowns = filterMap(
          Object.values(params.drilldowns),
          item => hydrateDrilldownProperties(cube, item) || null,
        );

        return {
          ...queryItem,
          params: {
            ...params,
            locale: params.locale || state.explorerServer.localeOptions[0],
            cube: cubeName,
            drilldowns: keyBy(resolvedDrilldowns, item => item.key),
            measures: keyBy(resolvedMeasures, item => item.key),
          },
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
  return (dispatch, getState, {tesseract}) =>
    olapClient.parseQueryURL(url.toString(), {anyServer: true}).then(query => {
      extractQueryParams(query);
      const queryItem = buildQuery({
        params: extractQueryParams(query),
      });
      dispatch(queriesActions.updateQuery(queryItem));
      dispatch(queriesActions.selectQuery(queryItem.key));
    });
}

/**
 * Performs a full replacement of the cubes stored in the state with fresh data
 * from the server.
 */
export function willReloadCubes(): ExplorerThunk<Promise<Record<string, TesseractCube>>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const locale = selectLocale(state);

    return tesseract.fetchSchema({locale: locale.code}).then(schema => {
      const plainCubes = filterMap(schema.cubes, cube =>
        cube.annotations.hide_in_ui === "true" ? null : cube,
      );
      const cubeMap = keyBy(plainCubes, i => i.name);
      dispatch(serverActions.updateServer({cubeMap}));
      return cubeMap;
    });
  };
}

/**
 * Replaces the cube on the current query, and updates related state.
 * If the new cube contains a measure with the same name as a measure in the
 * previous cube, keep its state.
 *
 * @param cubeName
 *   The name of the cube we intend to switch to.
 */
export function willSetCube(cubeName: string): ExplorerThunk<void> {
  return (dispatch, getState) => {
    const state = getState();

    const cubeMap = selectOlapCubeMap(state);
    const nextCube = cubeMap[cubeName];
    if (!nextCube) return;

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

    dispatch(
      queriesActions.updateCube({
        cube: nextCube.name,
        measures: keyBy(nextMeasures, item => item.key),
      }),
    );
  };
}

/**
 * Setups data server configuration on the global client instance.
 * Sets a new DataSource to the client instance, gets the server info, and
 * initializes the general state accordingly.
 */
export function willSetupClient(serverConfig: RequestInit): ExplorerThunk<Promise<void>> {
  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const locale = selectLocale(state);

    tesseract.requestConfig = serverConfig;
    return tesseract.fetchSchema({locale: locale.code}).then(
      schema => {
        dispatch(
          serverActions.updateServer({
            cubeMap: keyBy(schema.cubes, "name"),
            defaultLocale: schema.default_locale,
            localeOptions: schema.locales,
            online: true,
            url: tesseract.baseURL,
          }),
        );
      },
      () => {
        dispatch(
          serverActions.updateServer({
            online: false,
            url: tesseract.baseURL,
          }),
        );
      },
    );
  };
}

/**
 * Wraps a thunk in a set of actions to activate the loading UI components.
 */
export function underLoadingScreen<R>(
  thunk: ExplorerThunk<Promise<unknown>>,
): ExplorerThunk<Promise<void>> {
  return dispatch => {
    dispatch(loadingActions.setLoadingState("FETCHING"));
    return dispatch(thunk).then(
      () => {
        dispatch(loadingActions.setLoadingState("SUCCESS"));
      },
      error => {
        dispatch(loadingActions.setLoadingState("FAILURE", error.message));
      },
    );
  };
}
