import type {
  TesseractCube,
  TesseractDataResponse,
  TesseractFormat,
  TesseractMembersResponse,
} from "../api";
import {mapDimensionHierarchyLevels} from "../api/traverse";
import {filterMap} from "../utils/array";
import {describeData} from "../utils/object";
import {buildDataRequest, extractDataRequest} from "../utils/query";
import {
  type QueryResult,
  buildCut,
  buildDrilldown,
  buildMeasure,
  buildProperty,
  buildQuery,
} from "../utils/structs";
import {keyBy} from "../utils/transform";
import type {FileDescriptor} from "../utils/types";
import {isValidQuery, noop} from "../utils/validation";
import {loadingActions} from "./loading";
import {
  queriesActions,
  selectCubeName,
  selectCurrentQueryParams,
  selectLocale,
  selectMeasureItems,
  selectQueryItems,
} from "./queries";
import {selectOlapCube} from "./selectors";
import {selectOlapCubeMap, serverActions} from "./server";
import type {ExplorerThunk} from "./store";
import {pickDefaultDrilldowns} from "./utils";

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
export function willExecuteQuery(params?: {
  limit?: number;
  offset?: number;
}): ExplorerThunk<Promise<QueryResult>> {
  const {limit, offset} = params || {};

  return (dispatch, getState, {tesseract}) => {
    const state = getState();
    const params = selectCurrentQueryParams(state);
    const cube = selectOlapCube(state);

    if (!isValidQuery(params) || !cube) return Promise.resolve();

    const request = buildDataRequest(params);
    if (limit && offset) {
      request.limit = `${limit},${offset}`;
    }

    return tesseract
      .fetchData({request, format: "jsonrecords"})
      .then(response =>
        response.json().then((content: TesseractDataResponse) => {
          if (!response.ok) {
            throw new Error(`Backend Error: ${content.detail}`);
          }
          const {payload} = dispatch(
            queriesActions.updateResult({
              data: content.data,
              types: describeData(cube, params, content.data),
              headers: Object.fromEntries(response.headers),
              status: response.status || 200,
              url: response.url,
            }),
          );
          return payload;
        }),
      )
      .catch(error => {
        if (error.name === "TypeError" && error.message.includes("NetworkError")) {
          console.error("Network error or CORS error occurred:", error);
        } else if (error.message.includes("Unexpected token")) {
          console.error("Syntax error while parsing JSON:", error);
        } else if (error.message.includes("Backend Error")) {
          console.error("Server returned an error response:", error);
        } else {
          console.error("An unknown error occurred:", error);
        }
        const {payload} = dispatch(
          queriesActions.updateResult({
            data: [],
            types: {},
            error: error.message,
            status: 0,
            url: "",
          }),
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
export function willHydrateParams(suggestedCube = ""): ExplorerThunk<Promise<void>> {
  return (dispatch, getState) => {
    const state = getState();
    const cubeMap = selectOlapCubeMap(state);
    const queries = selectQueryItems(state);

    const defaultCube = cubeMap[suggestedCube] || Object.values(cubeMap)[0];

    const queryPromises = queries.map(queryItem => {
      const {params} = queryItem;
      const {measures: measureItems} = params;

      const cube = cubeMap[params.cube] || defaultCube;
      const levelMap = mapDimensionHierarchyLevels(cube);

      const resolvedMeasures = cube.measures.map(measure =>
        buildMeasure(
          measureItems[measure.name] || {
            active: false,
            key: measure.name,
            name: measure.name,
          },
        ),
      );

      const resolvedDrilldowns = filterMap(Object.values(params.drilldowns), item => {
        const [dimension, hierarchy, level] = levelMap[item.level] || [];
        if (!level) return null;
        const activeProperties = filterMap(item.properties, prop =>
          prop.active ? prop.name : null,
        );
        return level
          ? buildDrilldown({
              ...item,
              dimension: dimension.name,
              hierarchy: hierarchy.name,
              properties: level.properties.map(property =>
                buildProperty({
                  active: activeProperties.includes(property.name),
                  level: level.name,
                  name: property.name,
                }),
              ),
            })
          : null;
      });

      return {
        ...queryItem,
        params: {
          ...params,
          locale: params.locale || state.explorerServer.locale,
          cube: cube.name,
          drilldowns: keyBy(resolvedDrilldowns, item => item.key),
          measures: keyBy(resolvedMeasures, item => item.key),
        },
      };
    });

    return Promise.all(queryPromises).then(resolvedQueries => {
      const queryMap = keyBy(resolvedQueries, i => i.key);
      dispatch(queriesActions.resetQueries(queryMap));
    });
  };
}

/**
 * Parses the search parameters in an URL to create a QueryParam object,
 * then creates a new QueryItem in the UI containing it.
 */
export function willParseQueryUrl(url: string | URL): ExplorerThunk<Promise<void>> {
  return (dispatch, getState) => {
    const state = getState();
    const cubeMap = selectOlapCubeMap(state);

    const search = new URL(url).searchParams;
    const cube = search.get("cube");
    if (cube && cubeMap[cube]) {
      const queryItem = buildQuery({
        panel: search.get("panel") || "table",
        params: extractDataRequest(cubeMap[cube], search),
      });
      dispatch(queriesActions.updateQuery(queryItem));
      dispatch(queriesActions.selectQuery(queryItem.key));
    }

    return Promise.resolve();
  };
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
      },
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
      buildDrilldown({
        ...level,
        active: true,
        properties: level.properties.map(prop =>
          buildProperty({level: level.name, name: prop.name}),
        ),
      }),
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
