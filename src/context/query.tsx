import React, {createContext, useContext, useCallback, useEffect, useRef} from "react";
import type {QueryItem, DrilldownItem, CutItem} from "../utils/structs";
import {parsePermalink, serializePermalink, useUpdateUrl} from "../hooks/permalink";
import {useServerSchema} from "../hooks/useQueryApi";
import {useAsync} from "../hooks/useAsync";
import {keyBy} from "../utils/transform";
import {isValidQuery, hasProperty} from "../utils/validation";
import {buildCut, buildDrilldown, buildMeasure, buildProperty, buildQuery} from "../utils/structs";
import {useActions, useSettings} from "../hooks/settings";
import {useLogicLayer} from "../api/context";
import {useLocation} from "react-router-dom";
import {pickDefaultDrilldowns} from "../state/utils";
import {getValues} from "../utils/object";
import {getAnnotation} from "../utils/string";
import {TesseractCube} from "../api";
import {useSelector} from "react-redux";
import {selectCurrentQueryItem} from "../state/queries";

interface QueryContextProps {
  onChangeCube: (table: string, subtopic: string) => void;
  schemaLoading: boolean;
  membersLoading: boolean;
}

const QueryContext = createContext<QueryContextProps | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
  defaultCube?: string;
  serverURL: string;
  defaultDataLocale?: string;
  locale: string;
}

export function QueryProvider({
  children,
  defaultCube,
  locale,
  defaultDataLocale
}: QueryProviderProps) {
  const {tesseract} = useLogicLayer();
  const location = useLocation();
  const {updateCurrentQuery} = useActions();
  const {paginationConfig, measuresActive} = useSettings();
  const {data: schema, isLoading: schemaLoading} = useServerSchema();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);

  function fetchMembers(level: string, localeStr?: string, cubeName?: string) {
    return tesseract.fetchMembers({request: {cube: cubeName || "", level, locale: localeStr}});
  }
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
      let newQuery: QueryItem | undefined = parsePermalink(cubeMap[cube], searchParams);
      newQuery = isValidQuery(newQuery?.params) ? newQuery : buildQuery({params: {cube}});
      newQuery.params.locale = newQuery.params.locale || defaultDataLocale;
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

        runFetchMembers(Promise.all(promises)).then(data => {
          const drilldowns = data.map(item => item.drilldown);
          const cuts = data.map(item => item.cut);

          newQuery.params.drilldowns = keyBy(drilldowns, "key");

          const existingCuts = keyBy(
            Object.values(newQuery.params.cuts || {}).map(c => ({...c, key: c.level})),
            "key"
          );
          const newCuts = keyBy(cuts, "key");
          newQuery.params.cuts = {...newCuts, ...existingCuts};
          const newQueryItem = isValidQuery(newQuery.params) ? newQuery : undefined;
          if (newQueryItem) {
            updateCurrentQuery({...newQuery, link: serializePermalink(newQuery)});
          }
        });
      }
    }

    if (!cube && cubeMap) {
      const cubeDefault =
        defaultCube && hasProperty(cubeMap, defaultCube) ? defaultCube : Object.keys(cubeMap)[0];
      setDefaultValues(cubeMap[cubeDefault]);
    }
  }, [location.search, runFetchMembers, schema]);

  const onChangeCube = (table: string, subtopic: string) => {
    const cubeMap = schema?.cubeMap || {};
    const cubeArray = getValues(cubeMap);
    const cube = cubeArray.find(
      cube => cube.name === table && getAnnotation(cube, "subtopic", locale) === subtopic
    );
    if (cube) {
      setDefaultValues(cube);
    }
  };

  function setDefaultValues(cube: TesseractCube) {
    const drilldowns = pickDefaultDrilldowns(cube.dimensions).map(level =>
      buildDrilldown({
        ...level,
        key: level.name,
        active: true,
        properties: level.properties.map(prop =>
          buildProperty({level: level.name, name: prop.name})
        )
      })
    );
    const measuresLimit =
      typeof measuresActive !== "undefined" ? measuresActive : cube.measures.length;

    const measures = cube.measures.slice(0, measuresLimit).map(measure => {
      return buildMeasure({
        active: true,
        key: measure.name,
        name: measure.name,
        caption: measure.caption
      });
    });

    const panel = queryItem.panel;

    const query = buildQuery({
      params: {
        cube: cube.name,
        measures: keyBy(measures, item => item.key),
        drilldowns: keyBy(drilldowns, item => item.key),
        locale: defaultDataLocale
      },
      panel: panel ?? "table"
    });

    updateUrl(query);
  }

  return (
    <QueryContext.Provider
      value={{
        onChangeCube,
        schemaLoading,
        membersLoading
      }}
    >
      {children}
    </QueryContext.Provider>
  );
}

export function useQueryItem() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
}
