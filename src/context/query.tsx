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
  transintionLocaleLoading: boolean;
}

const QueryContext = createContext<QueryContextProps | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
  defaultCube?: string;
  serverURL: string;
}

export function QueryProvider({children, defaultCube}: QueryProviderProps) {
  const {tesseract} = useLogicLayer();
  const location = useLocation();
  const {updateCurrentQuery} = useActions();
  const {measuresActive, serverURL, defaultLocale} = useSettings();
  const {
    data: schema,
    isLoading: schemaLoading,
    isFetching: schemaFetching,
    isError: schemaError
  } = useServerSchema();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);
  const prevLocaleRef = useRef<string | undefined>();

  function fetchMembers(level: string, localeStr?: string, cubeName?: string) {
    return tesseract.fetchMembers({request: {cube: cubeName || "", level, locale: localeStr}});
  }

  const {run: runFetchMembers, isLoading: membersLoading} = useAsync<
    Array<{
      drilldown: DrilldownItem;
      cut: CutItem;
    }>
  >();

  const [transintionLocaleLoading, setTransintionLocaleLoading] = React.useState(false);

  useEffect(() => {
    if (schemaLoading) {
      setTransintionLocaleLoading(true);
    }
    const searchParams = new URLSearchParams(location.search);
    const cube = searchParams.get("cube");
    const cubeMap = schema?.cubeMap || undefined;
    if (cube && cubeMap && serverURL && cubeMap[cube] && schema?.online && !schemaFetching) {
      let newQuery: QueryItem | undefined = parsePermalink(cubeMap[cube], searchParams);
      newQuery = isValidQuery(newQuery?.params) ? newQuery : buildQuery({params: {cube}});
      newQuery.params.locale = defaultLocale || newQuery.params.locale;

      const dimensions: Record<string, string> = {};
      const hierarchies: Record<string, string> = {};
      // all levels
      const levels = Object.fromEntries(
        cubeMap[cube].dimensions.flatMap(dim =>
          dim.hierarchies.flatMap(hie =>
            hie.levels.map(lvl => {
              dimensions[lvl.name] = dim.name;
              hierarchies[lvl.name] = hie.name;
              return [lvl.name, lvl];
            })
          )
        )
      );

      const restDrilldownsKeys = Object.keys(levels).filter(
        key => !newQuery.params.drilldowns[key]
      );

      const restDrilldowns = restDrilldownsKeys.map(name => {
        const lvl = levels[name];
        return buildDrilldown({
          active: false,
          key: lvl.name,
          dimension: dimensions[name],
          hierarchy: hierarchies[name],
          level: name,
          properties: lvl.properties.map(prop => buildProperty({level: lvl.name, name: prop.name}))
        });
      });

      if (newQuery) {
        const promises = [...restDrilldowns, ...Object.values(newQuery.params.drilldowns)].map(
          dd => {
            const currentDrilldown = queryItem.params.drilldowns[dd.key];
            const localeChanged = prevLocaleRef.current !== newQuery?.params.locale;
            if (
              currentDrilldown &&
              currentDrilldown.members &&
              currentDrilldown.members.length > 0 &&
              !localeChanged &&
              cube === queryItem.params.cube
            ) {
              return Promise.resolve({
                drilldown: currentDrilldown,
                cut: buildCut({...currentDrilldown, active: false, members: []})
              });
            } else {
              return fetchMembers(dd.level, newQuery?.params.locale, cube).then(levelMeta => {
                const cut = buildCut({...dd, active: false, members: []});
                return {
                  drilldown: {
                    ...dd,
                    members: levelMeta.members
                  },
                  cut
                };
              });
            }
          }
        );

        runFetchMembers(Promise.all(promises)).then(data => {
          setTransintionLocaleLoading(false);
          prevLocaleRef.current = newQuery?.params.locale;
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

    if (!cube && cubeMap && serverURL && schema?.online) {
      const cubeDefault =
        defaultCube && hasProperty(cubeMap, defaultCube) ? defaultCube : Object.keys(cubeMap)[0];
      setDefaultValues(cubeMap[cubeDefault]);
    }
  }, [
    location.search,
    runFetchMembers,
    schema,
    schemaLoading,
    schemaFetching,
    serverURL,
    defaultLocale
  ]);

  const onChangeCube = (table: string, subtopic: string) => {
    const locale = defaultLocale || queryItem.params.locale;
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
    const {levels, timeComplete} = pickDefaultDrilldowns(cube.dimensions, cube);
    const drilldowns = levels.map(level =>
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
    const locale = defaultLocale || queryItem.params.locale;

    const query = buildQuery({
      params: {
        cube: cube.name,
        measures: keyBy(measures, item => item.key),
        drilldowns: keyBy(drilldowns, item => item.key),
        locale,
        timeComplete
      },
      panel: panel ?? "table"
    });

    updateUrl(query);
  }

  const contextValue = React.useMemo(
    () => ({
      onChangeCube,
      schemaLoading,
      membersLoading,
      transintionLocaleLoading
    }),
    [onChangeCube, schemaLoading, membersLoading, transintionLocaleLoading]
  );

  return <QueryContext.Provider value={contextValue}>{children}</QueryContext.Provider>;
}

export function useQueryItem() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
}
