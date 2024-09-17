import {
  type Action,
  type StateFromReducersMapObject,
  type ThunkAction,
  combineReducers,
  configureStore,
} from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch as useBaseDispatch,
  useSelector as useBaseSelector,
} from "react-redux";
import {ComplexityModuleClient, TesseractModuleClient} from "../api";
import {loadingSlice} from "./loading";
import {queriesSlice} from "./queries";
import {serverSlice} from "./server";

const reducerMap = {
  [loadingSlice.name]: loadingSlice.reducer,
  [queriesSlice.name]: queriesSlice.reducer,
  [serverSlice.name]: serverSlice.reducer,
};

export const reducer = combineReducers(reducerMap);

/**
 * Inyects the Client dependency to the thunk's extra argument.
 */
export function thunkExtraArg() {
  return {
    tesseract: new TesseractModuleClient(""),
    complexity: new ComplexityModuleClient(""),
    previewLimit: 50,
  };
}

export const storeFactory = () =>
  configureStore({
    reducer: reducerMap,
    middleware(getDefaultMiddleware) {
      return getDefaultMiddleware({
        thunk: {
          extraArgument: thunkExtraArg(),
        },
      });
    },
  });

type ExplorerThunkArg = ReturnType<typeof thunkExtraArg>;

export type ExplorerStore = ReturnType<typeof storeFactory>;
export type ExplorerState = StateFromReducersMapObject<typeof reducerMap>;
export type ExplorerDispatch = ExplorerStore["dispatch"];
export type ExplorerThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  ExplorerState,
  ExplorerThunkArg,
  Action<string>
>;

export const useDispatch: () => ExplorerDispatch = useBaseDispatch;
export const useSelector: TypedUseSelectorHook<ExplorerState> = useBaseSelector;
