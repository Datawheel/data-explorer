import {useReducer, useRef} from "react";
import {
  type QueryItem,
  type DrilldownItem,
  type CutItem,
  type FilterItem,
  type MeasureItem,
  buildQuery
} from "../utils/structs";
import {isValidQuery} from "../utils/validation";

type QueryState = {
  query: QueryItem | undefined;
  cube: string | undefined;
};

type QueryAction =
  | {type: "SET_QUERY"; payload: QueryItem}
  | {type: "SET_CUBE"; payload: string}
  | {type: "SET_CUT"; payload: {key: string; cut: CutItem}}
  | {type: "REMOVE_CUT"; payload: string}
  | {type: "UPDATE_CUTS"; payload: Record<string, CutItem>}
  | {type: "SET_DRILLDOWN"; payload: {key: string; drilldown: DrilldownItem}}
  | {type: "REMOVE_DRILLDOWN"; payload: string}
  | {type: "UPDATE_DRILLDOWNS"; payload: Record<string, DrilldownItem>}
  | {type: "SET_FILTER"; payload: {key: string; filter: FilterItem}}
  | {type: "REMOVE_FILTER"; payload: string}
  | {type: "UPDATE_FILTERS"; payload: Record<string, FilterItem>}
  | {type: "SET_MEASURE"; payload: {key: string; measure: MeasureItem}}
  | {type: "REMOVE_MEASURE"; payload: string}
  | {type: "UPDATE_MEASURES"; payload: Record<string, MeasureItem>}
  | {type: "UPDATE_PAGINATION"; payload: {offset?: number; limit?: number}}
  | {type: "UPDATE_LOCALE"; payload: string}
  | {type: "RESET_QUERY"};

type QueryReducerProps = {
  cube?: string;
  query?: QueryItem;
};

const defaultInitialState: QueryState = {
  query: undefined,
  cube: undefined
};

function queryReducer(state: QueryState, action: QueryAction): QueryState {
  if (
    !state.query &&
    action.type !== "SET_QUERY" &&
    action.type !== "SET_CUBE" &&
    action.type !== "RESET_QUERY"
  ) {
    return state;
  }

  switch (action.type) {
    case "SET_QUERY":
      return {
        ...state,
        query: action.payload
      };
    case "SET_CUBE":
      console.log(action.payload, "action.payload SET CUBE");
      return {
        ...state,
        cube: action.payload
      };
    case "SET_CUT": {
      const updatedCuts = {
        ...state.query.params.cuts,
        [action.payload.key]: action.payload.cut
      };
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query.params,
          cuts: updatedCuts
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "REMOVE_CUT": {
      const updatedCuts = {...state.query!.params.cuts};
      delete updatedCuts[action.payload];
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          cuts: updatedCuts
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_CUTS": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          cuts: action.payload
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "SET_DRILLDOWN": {
      const updatedDrilldowns = {
        ...state.query!.params.drilldowns,
        [action.payload.key]: action.payload.drilldown
      };
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          drilldowns: updatedDrilldowns
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "REMOVE_DRILLDOWN": {
      const updatedDrilldowns = {...state.query!.params.drilldowns};
      delete updatedDrilldowns[action.payload];
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          drilldowns: updatedDrilldowns
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_DRILLDOWNS": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          drilldowns: action.payload
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "SET_FILTER": {
      const updatedFilters = {
        ...state.query!.params.filters,
        [action.payload.key]: action.payload.filter
      };
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          filters: updatedFilters
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "REMOVE_FILTER": {
      const updatedFilters = {...state.query!.params.filters};
      delete updatedFilters[action.payload];
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          filters: updatedFilters
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_FILTERS": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          filters: action.payload
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "SET_MEASURE": {
      const updatedMeasures = {
        ...state.query!.params.measures,
        [action.payload.key]: action.payload.measure
      };
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          measures: updatedMeasures
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "REMOVE_MEASURE": {
      const updatedMeasures = {...state.query!.params.measures};
      delete updatedMeasures[action.payload];
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          measures: updatedMeasures
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_MEASURES": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          measures: action.payload
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_PAGINATION": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          pagiOffset: action.payload.offset ?? state.query!.params.pagiOffset,
          pagiLimit: action.payload.limit ?? state.query!.params.pagiLimit
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "UPDATE_LOCALE": {
      const updatedQuery = {
        ...state.query!,
        params: {
          ...state.query!.params,
          locale: action.payload
        }
      };
      return {
        ...state,
        query: isValidQuery(updatedQuery.params) ? updatedQuery : state.query
      };
    }
    case "RESET_QUERY":
      return defaultInitialState;
    default:
      return state;
  }
}

export function useQueryReducer(props?: QueryReducerProps) {
  const initialState = props
    ? {
        cube: props.cube,
        query: props.query ?? defaultInitialState.query
      }
    : defaultInitialState;

  const [state, dispatch] = useReducer(queryReducer, initialState);

  const setQuery = (query: QueryItem) => {
    dispatch({type: "SET_QUERY", payload: query});
  };

  const setCube = (cube: string) => {
    dispatch({type: "SET_CUBE", payload: cube});
  };

  const setCut = (key: string, cut: CutItem) => {
    dispatch({type: "SET_CUT", payload: {key, cut}});
  };

  const removeCut = (key: string) => {
    dispatch({type: "REMOVE_CUT", payload: key});
  };

  const updateCuts = (cuts: Record<string, CutItem>) => {
    dispatch({type: "UPDATE_CUTS", payload: cuts});
  };

  const setDrilldown = (key: string, drilldown: DrilldownItem) => {
    dispatch({type: "SET_DRILLDOWN", payload: {key, drilldown}});
  };

  const removeDrilldown = (key: string) => {
    dispatch({type: "REMOVE_DRILLDOWN", payload: key});
  };

  const updateDrilldowns = (drilldowns: Record<string, DrilldownItem>) => {
    dispatch({type: "UPDATE_DRILLDOWNS", payload: drilldowns});
  };

  const setFilter = (key: string, filter: FilterItem) => {
    dispatch({type: "SET_FILTER", payload: {key, filter}});
  };

  const removeFilter = (key: string) => {
    dispatch({type: "REMOVE_FILTER", payload: key});
  };

  const updateFilters = (filters: Record<string, FilterItem>) => {
    dispatch({type: "UPDATE_FILTERS", payload: filters});
  };

  const setMeasure = (key: string, measure: MeasureItem) => {
    dispatch({type: "SET_MEASURE", payload: {key, measure}});
  };

  const removeMeasure = (key: string) => {
    dispatch({type: "REMOVE_MEASURE", payload: key});
  };

  const updateMeasures = (measures: Record<string, MeasureItem>) => {
    dispatch({type: "UPDATE_MEASURES", payload: measures});
  };

  const updatePagination = (pagination: {offset?: number; limit?: number}) => {
    dispatch({type: "UPDATE_PAGINATION", payload: pagination});
  };

  const updateLocale = (locale: string) => {
    dispatch({type: "UPDATE_LOCALE", payload: locale});
  };

  const resetQuery = () => {
    dispatch({type: "RESET_QUERY"});
  };

  return {
    query: state.query,
    cube: state.cube,
    setQuery,
    setCube,
    setCut,
    removeCut,
    updateCuts,
    setDrilldown,
    removeDrilldown,
    updateDrilldowns,
    setFilter,
    removeFilter,
    updateFilters,
    setMeasure,
    removeMeasure,
    updateMeasures,
    updatePagination,
    updateLocale,
    resetQuery
  };
}
