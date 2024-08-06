import * as React from "react";

// Define types for state and action
interface AsyncState<T> {
  status: "idle" | "pending" | "resolved" | "rejected";
  data: T | null;
  error: Error | null;
}

type AsyncAction<T> =
  | {type: "idle"}
  | {type: "pending"}
  | {type: "resolved"; data: T}
  | {type: "rejected"; error: Error};

// Type for the dispatch function
type Dispatch<A> = (value: A) => void;

// useSafeDispatch hook
function useSafeDispatch<T>(dispatch: Dispatch<AsyncAction<T>>) {
  const mounted = React.useRef(false);

  React.useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return React.useCallback(
    (...args: Parameters<typeof dispatch>) => {
      if (mounted.current) {
        dispatch(...args);
      }
    },
    [dispatch]
  );
}

// Default initial state
const defaultInitialState: AsyncState<null> = {status: "idle", data: null, error: null};

// useAsync hook
function useAsync<T>(initialState?: Partial<AsyncState<T>>) {
  const initialStateRef = React.useRef({
    ...defaultInitialState,
    ...initialState
  });

  const [state, dispatch] = React.useReducer(
    (state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> => {
      switch (action.type) {
        case "idle":
          return {...state, status: "idle", data: null, error: null};
        case "pending":
          return {...state, status: "pending"};
        case "resolved":
          return {...state, status: "resolved", data: action.data};
        case "rejected":
          return {...state, status: "rejected", error: action.error};
        default:
          return state;
      }
    },
    initialStateRef.current
  );

  const safeDispatch = useSafeDispatch(dispatch);

  const setData = React.useCallback(
    (data: T) => safeDispatch({type: "resolved", data}),
    [safeDispatch]
  );

  const setError = React.useCallback(
    (error: Error) => safeDispatch({type: "rejected", error}),
    [safeDispatch]
  );

  const reset = React.useCallback(() => safeDispatch({type: "idle"}), [safeDispatch]);

  const run = React.useCallback(
    (promise: Promise<T>) => {
      if (!promise || !promise.then) {
        throw new Error(
          "The argument passed to useAsync().run must be a promise. Maybe a function that's passed isn't returning anything?"
        );
      }

      safeDispatch({type: "pending"});

      return promise.then(
        data => {
          setData(data);
          return data;
        },
        error => {
          setError(error);
          return Promise.reject(error);
        }
      );
    },
    [safeDispatch, setData, setError]
  );

  return {
    isIdle: state.status === "idle",
    isLoading: state.status === "pending",
    isError: state.status === "rejected",
    isSuccess: state.status === "resolved",
    setData,
    setError,
    error: state.error,
    status: state.status,
    data: state.data,
    run,
    reset
  };
}

export {useAsync};
