import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {
  TesseractCube,
  TesseractDataResponse,
  TesseractFormat,
  TesseractMembersResponse
} from "../api";
import type {TesseractLevel, TesseractHierarchy, TesseractDimension} from "../api/tesseract/schema";
import {queryParamsToRequest, requestToQueryParams} from "../api/tesseract/parse";
import {mapDimensionHierarchyLevels} from "../api/traverse";
import {filterMap} from "../utils/array";
import {describeData} from "../utils/object";
import {
  type QueryResult,
  buildCut,
  buildDrilldown,
  buildMeasure,
  buildProperty,
  buildQuery
} from "../utils/structs";
import {keyBy} from "../utils/transform";
import type {FileDescriptor} from "../utils/types";
import {isValidQuery, noop} from "../utils/validation";
import {pickDefaultDrilldowns} from "../state/utils";
import {useLogicLayer} from "../api/context";

// Hook to fetch and manage server schema
// check locale usage. but it is working fine. Really useful
// Add server config
export function useServerSchema(baseURL: string, defaultLocale?: string) {
  const {tesseract} = useLogicLayer();

  return useQuery({
    queryKey: ["schema", baseURL, defaultLocale],
    queryFn: async () => {
      const search = new URLSearchParams(location.search);
      const locale = search.get("locale");

      try {
        const schema = await tesseract.fetchSchema({locale: locale || defaultLocale});
        const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
        const cubeMap = keyBy(cubes, "name");

        return {
          cubeMap,
          locale: defaultLocale || schema.default_locale,
          localeOptions: schema.locales,
          online: true,
          url: baseURL
        };
      } catch (error) {
        return {
          cubeMap: {},
          locale: defaultLocale || "",
          localeOptions: [],
          online: false,
          url: baseURL
        };
      }
    }
  });
}

// Hook to download query data
export function useDownloadQuery() {
  const {tesseract} = useLogicLayer();

  return useMutation({
    mutationFn: async ({
      params,
      format
    }: {
      params: any;
      format: `${TesseractFormat}`;
    }): Promise<FileDescriptor> => {
      if (!isValidQuery(params)) {
        throw new Error("The current query is not valid.");
      }

      const queryParams = {...params, pagiLimit: 0, pagiOffset: 0};
      const response = await tesseract.fetchData({
        request: queryParamsToRequest(queryParams),
        format
      });

      const blob = await response.blob();
      return {
        content: blob,
        extension: format.replace(/json\w+/, "json"),
        name: `${params.cube}_${new Date().toISOString()}`
      };
    }
  });
}

// Hook to fetch query data
export function useFetchQuery(
  queryParams: any,
  options?: {
    limit?: number;
    offset?: number;
    withoutPagination?: boolean;
    enabled?: boolean;
  }
) {
  const {tesseract} = useLogicLayer();
  const {limit = 0, offset = 0, withoutPagination = false, enabled = true} = options || {};

  return useQuery({
    queryKey: ["queryData", queryParams, limit, offset, withoutPagination],
    queryFn: async (): Promise<QueryResult> => {
      if (!isValidQuery(queryParams)) {
        throw new Error("Invalid query");
      }

      const request = queryParamsToRequest(queryParams);
      if (limit || offset) {
        request.limit = `${limit},${offset}`;
      } else if (withoutPagination) {
        request.limit = "0,0";
      }

      const response = await tesseract.fetchData({request, format: "jsonrecords"});
      const content: TesseractDataResponse = await response.json();

      if (!response.ok) {
        throw new Error(`Backend Error: ${content.detail}`);
      }

      // Fetch the cube data
      const cubeData = await tesseract.fetchCube({cube: queryParams.cube});

      return {
        data: content.data,
        page: content.page,
        types: describeData(cubeData, queryParams, content),
        headers: Object.fromEntries(response.headers),
        status: response.status || 200,
        url: response.url
      };
    },
    enabled
  });
}

// Hook to fetch members for a level
export function useMembers(level: string, localeStr?: string, cubeName?: string) {
  const {tesseract} = useLogicLayer();

  return useQuery({
    queryKey: ["members", level, localeStr, cubeName],
    queryFn: async (): Promise<TesseractMembersResponse> => {
      return tesseract.fetchMembers({
        request: {cube: cubeName || "", level, locale: localeStr}
      });
    },
    enabled: !!level
  });
}

// Hook to hydrate params
export function useHydrateParams(
  cubeMap: Record<string, TesseractCube>,
  queries: Array<{
    key: string;
    params: {
      cube: string;
      measures: Record<string, any>;
      drilldowns: Record<
        string,
        {level: string; properties: Array<{active: boolean; name: string}>}
      >;
    };
  }>,
  suggestedCube = ""
) {
  const queryClient = useQueryClient();
  const {tesseract} = useLogicLayer();

  function isCompleteTuple(
    tuple: [TesseractLevel, TesseractHierarchy, TesseractDimension] | undefined
  ): tuple is [TesseractLevel, TesseractHierarchy, TesseractDimension] {
    return tuple !== undefined && tuple.length === 3 && tuple.every(item => item !== undefined);
  }

  return useMutation({
    mutationFn: async () => {
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
              caption: measure.caption
            }
          )
        );

        const resolvedDrilldowns = filterMap(
          Object.values(params.drilldowns),
          (item: {level: string; properties: Array<{active: boolean; name: string}>}) => {
            const levelTuple = levelMap[item.level];
            if (!isCompleteTuple(levelTuple)) return null;

            const [level, hierarchy, dimension] = levelTuple!;

            const activeProperties = filterMap(
              item.properties,
              (prop: {active: boolean; name: string}) => (prop.active ? prop.name : null)
            );
            return buildDrilldown({
              active: true,
              key: level.name,
              dimension: dimension.name!,
              hierarchy: hierarchy.name!,
              level: level.name,
              captionProperty: "",
              members: [],
              properties: level.properties.map(property =>
                buildProperty({
                  active: activeProperties.includes(property.name),
                  level: level.name,
                  name: property.name
                })
              )
            });
          }
        );

        return {
          ...queryItem,
          params: {
            ...params,
            cube: cube.name,
            drilldowns: keyBy(resolvedDrilldowns, item => item.key),
            measures: keyBy(resolvedMeasures, item => item.key)
          }
        };
      });

      const resolvedQueries = await Promise.all(queryPromises);
      return keyBy(resolvedQueries, i => i.key);
    },
    onSuccess: queryMap => {
      // Update the query client cache with the hydrated queries
      queryClient.setQueryData(["hydratedQueries"], queryMap);
    }
  });
}

// Hook to parse query URL
export function useParseQueryUrl() {
  const queryClient = useQueryClient();
  const {tesseract} = useLogicLayer();

  return useMutation({
    mutationFn: async ({
      url,
      cubeMap
    }: {
      url: string | URL;
      cubeMap: Record<string, TesseractCube>;
    }) => {
      const search = new URL(url).searchParams;
      const cube = search.get("cube");

      if (cube && cubeMap[cube]) {
        const params = requestToQueryParams(cubeMap[cube], search);

        const queryItem = buildQuery({
          panel: search.get("panel") || "table",
          chart: search.get("chart") || "",
          params
        });

        return queryItem;
      }

      return null;
    },
    onSuccess: queryItem => {
      if (queryItem) {
        // Update the query client cache
        queryClient.setQueryData(["currentQuery"], queryItem);
        queryClient.setQueryData(["selectedQuery"], queryItem.key);
      }
    }
  });
}

// Hook to reload cubes
export function useReloadCubes() {
  const {tesseract} = useLogicLayer();

  return useMutation({
    mutationFn: async ({locale}: {locale: {code: string}}) => {
      const schema = await tesseract.fetchSchema({locale: locale.code});
      const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
      return keyBy(cubes, i => i.name);
    },
    onSuccess: cubeMap => {
      // Update the query client cache
      const queryClient = useQueryClient();
      queryClient.setQueryData(["cubeMap"], cubeMap);
    }
  });
}

// Hook to set cube
export function useSetCube() {
  const queryClient = useQueryClient();
  const {tesseract, dataLocale} = useLogicLayer();

  return useMutation({
    mutationFn: async ({
      cubeName,
      cubeMap,
      measuresActive
    }: {
      cubeName: string;
      cubeMap: Record<string, TesseractCube>;
      measuresActive?: number;
    }) => {
      const nextCube = cubeMap[cubeName];
      if (!nextCube) return null;

      const measuresLimit =
        typeof measuresActive !== "undefined" ? measuresActive : nextCube.measures.length;

      const nextMeasures = nextCube.measures.slice(0, measuresLimit).map(measure => {
        return buildMeasure({
          active: true,
          key: measure.name,
          name: measure.name,
          caption: measure.caption
        });
      });

      const nextDrilldowns = pickDefaultDrilldowns(nextCube.dimensions).map(level =>
        buildDrilldown({
          ...level,
          key: level.name,
          active: true,
          properties: level.properties.map(prop =>
            buildProperty({level: level.name, name: prop.name})
          )
        })
      );

      // Fetch members for each drilldown
      const drilldownPromises = nextDrilldowns.map(async dd => {
        const levelMeta = await tesseract.fetchMembers({
          request: {cube: nextCube.name, level: dd.level, locale: dataLocale}
        });

        return {
          ...dd,
          members: levelMeta.members
        };
      });

      const drilldownsWithMembers = await Promise.all(drilldownPromises);

      return {
        cube: nextCube.name,
        measures: keyBy(nextMeasures, item => item.key),
        drilldowns: keyBy(drilldownsWithMembers, item => item.key),
        locale: dataLocale
      };
    },
    onSuccess: result => {
      if (result) {
        // Update the query client cache
        queryClient.setQueryData(["currentCube"], result.cube);
        queryClient.setQueryData(["measures"], result.measures);
        queryClient.setQueryData(["drilldowns"], result.drilldowns);
        if (result.locale) {
          queryClient.setQueryData(["locale"], result.locale);
        }
      }
    }
  });
}
