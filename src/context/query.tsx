import React, {createContext, useContext, useCallback, useEffect} from "react";
import type {QueryItem, DrilldownItem, CutItem} from "../utils/structs";
import {parsePermalink, serializePermalink, useUpdateUrl} from "../hooks/permalink";
import {useServerSchema} from "../hooks/useQueryApi";
import {useAsync} from "../hooks/useAsync";
import {keyBy} from "../utils/transform";
import {isValidQuery, hasProperty} from "../utils/validation";
import {buildCut, buildDrilldown, buildMeasure, buildProperty, buildQuery} from "../utils/structs";
import {useActions, useSettings} from "../hooks/settings";
import {useLogicLayer} from "../api/context";
import {useLocation, useSearchParams} from "react-router-dom";
import {pickDefaultDrilldowns} from "../state/utils";
import {getValues} from "../utils/object";
import {getAnnotation} from "../utils/string";
import {TesseractCube} from "../api";
import {useSelector} from "react-redux";
import {
  selectDrilldownMap,
  selectDrilldownItems,
  selectCurrentQueryItem,
  selectPaginationParams
} from "../state/queries";
import {TesseractLevel} from "../api/tesseract/schema";

interface QueryContextProps {
  onChangeCube: (table: string, subtopic: string) => void;
}

const QueryContext = createContext<QueryContextProps | undefined>(undefined);

interface QueryProviderProps {
  children: React.ReactNode;
  defaultCube?: string;
  serverURL: string;
  defaultDataLocale?: string;
  locale: string;
}

export function QueryProvider({children, defaultCube, locale}: QueryProviderProps) {
  const {tesseract} = useLogicLayer();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {updateCurrentQuery, updateDrilldown, updateCut} = useActions();

  function fetchMembers(level: string, localeStr?: string, cubeName?: string) {
    return tesseract.fetchMembers({request: {cube: cubeName || "", level, locale: localeStr}});
  }

  const {paginationConfig, measuresActive} = useSettings();
  const {data: schema, isLoading: schemaLoading} = useServerSchema();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);
  const {limit, offset} = useSelector(selectPaginationParams);

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
    if (limit && offset !== undefined) {
      console.log("limit", limit);
      console.log("offset", offset);
      updateUrl();
    }
  }, [limit, offset]);

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

        runFetchMembers(Promise.all(promises)).then(data => {
          const drilldowns = data.map(item => item.drilldown);
          const cuts = data.map(item => item.cut);

          newQuery.params.drilldowns = keyBy(drilldowns, "key");

          // Merge existing cuts with new cuts, preserving existing ones
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
    // Is there a better way to find a cube ?
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

    const query = buildQuery({
      params: {
        cube: cube.name,
        measures: keyBy(measures, item => item.key),
        drilldowns: keyBy(drilldowns, item => item.key)
      }
    });
    // saque el update query
    updateUrl(query);
  }

  return <QueryContext.Provider value={{onChangeCube}}>{children}</QueryContext.Provider>;
}

// THE SERIALIZATION OF THE QUERY IS DONE IN THE QUERY PROVIDER SHOULD BE IN A HOOK!!!

export function useQueryItem() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
}

// useEffect(() => {
//   const searchParams = new URLSearchParams(location.search);
//   const cube = searchParams.get("cube");
//   const cubeMap = schema?.cubeMap || undefined;

//   if (cube && cubeMap) {
//     let query: QueryItem | undefined = parsePermalink(cubeMap[cube], searchParams);
//     query = isValidQuery(query?.params) ? query : buildQuery({params: {cube}});

//     if (query && isValidQuery(query.params)) {
//       updateCurrentQuery({...query, link: serializePermalink(query)});
//     }
//   }
//   if (!cube && cubeMap) {
//     const cubeDefault =
//       defaultCube && hasProperty(cubeMap, defaultCube) ? defaultCube : Object.keys(cubeMap)[0];
//     setDefaultValues(cubeMap[cubeDefault]);
//   }
// }, [location.search, schema]);

// useEffect(() => {
//   if (isMembersSuccess && membersData) {
//     if (queryItem) {
//       const query = buildQuery({});

//       const drilldowns = membersData.map(item => item.drilldown);
//       const cuts = membersData.map(item => item.cut);
//       query.params.drilldowns = keyBy(drilldowns, "key");
//       // Merge existing cuts with new cuts, preserving existing ones
//       const existingCuts = keyBy(
//         Object.values(query.params.cuts || {}).map(c => ({...c, key: c.level})),
//         "key"
//       );
//       const newCuts = keyBy(cuts, "key");
//       query.params.cuts = {...newCuts, ...existingCuts};

//       const newQueryItem = isValidQuery(query.params) ? query : undefined;
//       if (newQueryItem) {
//         updateCurrentQuery(newQueryItem);
//       }
//     }
//   }
// }, [isMembersSuccess, membersData, queryItem]);

// const drilldowns = useSelector(selectDrilldownMap);
// const ditems = useSelector(selectDrilldownItems);

// const createCutHandler = useCallback((level: TesseractLevel) => {
//   updateCut(buildCut({...level, active: false}));
// }, []);

// function createDrilldown(level: TesseractLevel, cuts: CutItem[]) {
//   if (!drilldowns[level.name] && !ditems.find(d => d.level === level.name)) {
//     const drilldown = buildDrilldown({...level, key: level.name, active: true});
//     updateDrilldown(drilldown);
//     const cut = cuts.find(cut => cut.level === drilldown.level);
//     if (!cut) {
//       createCutHandler(level);
//     }
//     return drilldown;
//   }
// }
