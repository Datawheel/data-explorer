import React, {createContext, useContext, useState, useEffect} from "react";
import {useQueryReducer} from "../hooks/useQueryReducer";
import type {QueryItem, DrilldownItem, CutItem} from "../utils/structs";
import {parsePermalink} from "../hooks/permalink";
import {useServerSchema} from "../hooks/useQueryApi";
import {useAsync} from "../hooks/useAsync";
import {keyBy} from "../utils/transform";
import {isValidQuery, hasProperty} from "../utils/validation";
import {buildCut, buildDrilldown, buildMeasure, buildProperty, buildQuery} from "../utils/structs";
import {useSettings} from "../hooks/settings";
import {useLogicLayer} from "../api/context";
import {useLocation, useParams, useSearchParams} from "react-router-dom";
import {pickDefaultDrilldowns} from "../state/utils";

interface QueryContextProps {
  query: QueryItem | undefined;
  cube: string | undefined;
  setQuery: (query: QueryItem) => void;
  setCube: (cube: string) => void;
  setCut: (key: string, cut: any) => void;
  removeCut: (key: string) => void;
  updateCuts: (cuts: Record<string, any>) => void;
  setDrilldown: (key: string, drilldown: any) => void;
  removeDrilldown: (key: string) => void;
  updateDrilldowns: (drilldowns: Record<string, any>) => void;
  setFilter: (key: string, filter: any) => void;
  removeFilter: (key: string) => void;
  updateFilters: (filters: Record<string, any>) => void;
  setMeasure: (key: string, measure: any) => void;
  removeMeasure: (key: string) => void;
  updateMeasures: (measures: Record<string, any>) => void;
  updatePagination: (pagination: {offset?: number; limit?: number}) => void;
  updateLocale: (locale: string) => void;
  resetQuery: () => void;
}

const QueryContext = createContext<QueryContextProps | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
  defaultCube?: string;
  defaultQuery?: QueryItem;
  serverURL: string;
  defaultLocale?: string;
}

export function QueryProvider({
  children,
  defaultCube,
  defaultQuery,
  serverURL,
  defaultLocale
}: QueryProviderProps) {
  const queryReducer = useQueryReducer({
    cube: defaultCube || undefined,
    query: defaultQuery || buildQuery({})
  });
  const {tesseract} = useLogicLayer();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  console.log(searchParams, "results");
  console.log(location, "results");

  function fetchMembers(level: string, localeStr?: string, cubeName?: string) {
    return tesseract.fetchMembers({request: {cube: cubeName || "", level, locale: localeStr}});
  }

  const {paginationConfig, measuresActive} = useSettings();

  const {data: schema, isLoading: schemaLoading} = useServerSchema(
    serverURL,
    defaultLocale || "en"
  );

  const {
    run: runFetchMembers,
    data: membersData,
    isSuccess: isMembersSuccess,
    isLoading: membersLoading
  } = useAsync<
    Array<{
      drilldown: DrilldownItem;
      cut: CutItem;
    }>
  >();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cube = searchParams.get("cube");
    const cubeMap = schema?.cubeMap || undefined;

    if (cube && cubeMap) {
      console.log(searchParams, "searchParams");
      console.log(cube, "cube");
      console.log(cubeMap, "cubeMap");
      let query: QueryItem | undefined = parsePermalink(cubeMap[cube], searchParams);
      query = isValidQuery(query?.params) ? query : buildQuery({params: {cube}});

      if (query && isValidQuery(query.params)) {
        queryReducer.setQuery(query);
        queryReducer.setCube(cube);
      }
    }
    if (!cube && cubeMap) {
      const cubeDefault =
        defaultCube && hasProperty(cubeMap, defaultCube) ? defaultCube : Object.keys(cubeMap)[0];
      queryReducer.setCube(cubeDefault);
    }
  }, [location.search, schema]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cube = searchParams.get("cube");
    const cubeMap = schema?.cubeMap || undefined;
    if (cube && cubeMap) {
      let newQuery: QueryItem | undefined = parsePermalink(cubeMap[cube], searchParams);
      newQuery = isValidQuery(newQuery?.params) ? newQuery : buildQuery({params: {cube}});

      if (newQuery) {
        const promises = Object.values(newQuery.params.drilldowns).map(dd => {
          return fetchMembers(dd.level, newQuery?.params.locale, cube).then(levelMeta => {
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

        const promisesData = Promise.all(promises);
        runFetchMembers(promisesData);
      }
      queryReducer.setQuery(newQuery || buildQuery({}));
    }
  }, [location.search, runFetchMembers, schema]);

  console.log(queryReducer.cube, queryReducer.query, "queryReducer");

  const onChangeCube = (cube: string) => {
    const cubeMap = schema?.cubeMap || {};
    const nextCube = cubeMap[cube];
    if (nextCube) {
      //add default params
      const measuresLimit =
        typeof measuresActive !== "undefined" ? measuresActive : nextCube.measures.length;
      const measures = nextCube.measures.slice(0, measuresLimit).map(measure => {
        return buildMeasure({
          active: true,
          key: measure.name,
          name: measure.name,
          caption: measure.caption
        });
      });

      const drilldowns = pickDefaultDrilldowns(nextCube.dimensions).map(level =>
        buildDrilldown({
          ...level,
          key: level.name,
          active: true,
          properties: level.properties.map(prop =>
            buildProperty({level: level.name, name: prop.name})
          )
        })
      );
      queryReducer.setCube(cube);
      queryReducer.setQuery(
        buildQuery({
          params: {
            cube,
            measures: keyBy(measures, item => item.key),
            drilldowns: keyBy(drilldowns, item => item.key)
          }
        })
      );
    }
  };

  return <QueryContext.Provider value={queryReducer}>{children}</QueryContext.Provider>;
}

export function useQueryItem() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
}
