import {useQuery, useMutation, keepPreviousData} from "@tanstack/react-query";
import type {TesseractCube, TesseractDataResponse, TesseractFormat} from "../api";
import {queryParamsToRequest} from "../api/tesseract/parse";
import {filterMap} from "../utils/array";
import {describeData, getOrderValue, getValues} from "../utils/object";
import {buildDrilldown, buildProperty, QueryParams} from "../utils/structs";
import {keyBy} from "../utils/transform";
import type {FileDescriptor} from "../utils/types";
import {isValidQuery} from "../utils/validation";
import {useLogicLayer} from "../api/context";
import {useSettings} from "./settings";
import {useSelector} from "../state";
import {selectCurrentQueryItem} from "../state/queries";

export function useServerSchema() {
  const {tesseract} = useLogicLayer();
  const {serverURL, defaultLocale} = useSettings();
  return useQuery({
    queryKey: ["schema", serverURL, defaultLocale],
    queryFn: async () => {
      const search = new URLSearchParams(location.search);
      const locale = defaultLocale || search.get("locale") || undefined;

      try {
        const schema = await tesseract.fetchSchema({locale});
        const cubes = schema.cubes.filter(cube => !cube.annotations.hide_in_ui);
        const cubeMap = keyBy(cubes, "name");

        return {
          cubeMap,
          locale: defaultLocale || schema.default_locale,
          localeOptions: schema.locales,
          online: true,
          url: serverURL
        };
      } catch (error) {
        return {
          cubeMap: {},
          locale: defaultLocale || "",
          localeOptions: [],
          online: false,
          url: serverURL
        };
      }
    },
    staleTime: 300000
  });
}

export const useMeasureItems = () => {
  const {data: schema} = useServerSchema();
  const {params} = useSelector(selectCurrentQueryItem);
  const measures = schema?.cubeMap[params.cube]?.measures || [];
  return measures;
};

export const useSelectedItem = () => {
  const {data: schema} = useServerSchema();
  const {params} = useSelector(selectCurrentQueryItem);
  const selectedItem = schema?.cubeMap[params.cube];
  return selectedItem;
};

export const useCubeItems = () => {
  const {data: schema} = useServerSchema();
  const cubeItems = schema?.cubeMap;
  return getValues(cubeItems || {});
};

export const useDimensionItems = () => {
  const {data: schema} = useServerSchema();
  const {params} = useSelector(selectCurrentQueryItem);
  const dimensions = schema?.cubeMap[params.cube]?.dimensions || [];
  const requiredDimensions =
    schema?.cubeMap[params.cube]?.annotations.required_dimensions || ([] as string[]);

  return dimensions
    .map(dim => ({
      item: {
        ...dim,
        hierarchies: dim.hierarchies
          .slice()
          .map(hierarchy => {
            hierarchy.levels.slice().sort((a, b) => getOrderValue(a) - getOrderValue(b));
            return hierarchy;
          })
          .sort((a, b) => getOrderValue(a) - getOrderValue(b)),
        required: requiredDimensions.includes(dim.name)
      },
      count: dim.hierarchies.reduce((acc, hie) => acc + hie.levels.length, 0),
      alpha: dim.hierarchies.reduce((acc, hie) => acc.concat(hie.name, "-"), "")
    }))
    .sort(
      (a, b) =>
        getOrderValue(a.item) - getOrderValue(b.item) ||
        b.count - a.count ||
        a.alpha.localeCompare(b.alpha)
    )
    .map(i => i.item);
};

export const useRequiredDimensions = () => {
  const dimensions = useDimensionItems();
  return dimensions.filter(dim => dim.required);
};

// include to download query ISO 3 by default for drilldowns that has that property.

function getISO3Drilldowns({cube, search}: {cube?: TesseractCube; search: URLSearchParams}) {
  const ISO_3_CODE = "ISO 3";
  if (!cube) return false;
  function getList(search: URLSearchParams, key: string, separator: string): string[] {
    return search
      .getAll(key)
      .join(separator)
      .split(separator)
      .filter(token => token);
  }

  const dimensions: Record<string, string> = {};
  const hierarchies: Record<string, string> = {};
  const levels = Object.fromEntries(
    cube.dimensions.flatMap(dim =>
      dim.hierarchies.flatMap(hie =>
        hie.levels.map(lvl => {
          dimensions[lvl.name] = dim.name;
          hierarchies[lvl.name] = hie.name;
          return [lvl.name, lvl];
        })
      )
    )
  );

  const properties = [ISO_3_CODE];
  const drilldowns = getList(search, "drilldowns", ",").map(name => {
    const lvl = levels[name];
    return buildDrilldown({
      active: true,
      key: lvl.name,
      dimension: dimensions[name],
      hierarchy: hierarchies[name],
      level: name,
      properties: filterMap(lvl.properties, prop =>
        properties.includes(prop.name)
          ? buildProperty({name: prop.name, level: name, active: true})
          : null
      )
    });
  });

  return keyBy(drilldowns, "key");
}

// Hook to download query data
export function useDownloadQuery() {
  const {tesseract} = useLogicLayer();
  const {params} = useSelector(selectCurrentQueryItem);
  const {data: schema} = useServerSchema();

  return useMutation({
    mutationFn: async ({format}: {format: `${TesseractFormat}`}): Promise<FileDescriptor> => {
      if (!isValidQuery(params)) {
        throw new Error("The current query is not valid.");
      }

      const queryParams = {...params, pagiLimit: 0, pagiOffset: 0};

      const drilldowns = getISO3Drilldowns({
        cube: schema?.cubeMap[params.cube],
        search: new URLSearchParams(location.search)
      });

      const paramsUpdated = drilldowns ? {...queryParams, drilldowns} : queryParams;
      const request = queryParamsToRequest(paramsUpdated);
      const response = await tesseract.fetchData({
        request,
        format
      });

      const blob = await response.blob();
      return {
        content: blob,
        extension: format.replace(/json\w+/, "json"),
        name: `${params.cube}_${new Date().toISOString()}`
      };
    },
    throwOnError: false
  });
}

export function useFetchQuery(
  queryParams?: QueryParams,
  queryLink?: string,
  options?: {
    limit?: number;
    offset?: number;
    withoutPagination?: boolean;
    enabled?: boolean;
  }
) {
  const {tesseract} = useLogicLayer();
  const {limit = 0, offset = 0, withoutPagination = false} = options || {};

  const key = withoutPagination ? ["table", queryLink, "withoutPagination"] : ["table", queryLink];
  const {data: schema} = useServerSchema();
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!isValidQuery(queryParams)) {
        throw new Error("Invalid query");
      }
      if (queryParams) {
        const request = queryParamsToRequest(queryParams);
        if (limit || offset) {
          request.limit = `${limit},${offset}`;
        }
        if (withoutPagination) {
          request.limit = "0,0";
        }

        const response = await tesseract.fetchData({
          request,
          format: "jsonrecords"
        });
        const content: TesseractDataResponse = await response.json();

        if (!response.ok) {
          throw new Error(`Backend Error: ${content.detail}`);
        }

        if (!schema?.cubeMap[queryParams.cube]) {
          throw new Error("Cube not found");
        }
        const cubeData = schema?.cubeMap[queryParams.cube];

        return {
          data: content.data,
          page: content.page,
          types: describeData(cubeData, queryParams, content),
          headers: Object.fromEntries(response.headers),
          status: response.status || 200,
          url: response.url
        };
      }
    },
    staleTime: 300000,
    enabled: Boolean(queryLink),
    retry: false,
    placeholderData: withoutPagination ? undefined : keepPreviousData
  });
}
