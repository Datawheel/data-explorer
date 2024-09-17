import {createSelector, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import type {TesseractCube} from "../api";
import {getKeys, getValues} from "../utils/object";
import type {ExplorerState} from "./store";

export interface ServerState {
  cubeMap: Record<string, TesseractCube>;
  defaultLocale: string;
  localeOptions: string[];
  online: boolean | undefined;
  url: string;
}

const name = "explorerServer";

const initialState: ServerState = {
  cubeMap: {},
  defaultLocale: "",
  localeOptions: [],
  online: undefined,
  url: "",
};

export const serverSlice = createSlice({
  name,
  initialState,
  reducers: {
    /**
     * Replaces the specified keys in the ServerState with the provided values.
     */
    updateServer(state, action: PayloadAction<Partial<ServerState>>) {
      return {...state, ...action.payload};
    },

    /**
     * Updates the list of locales supported by the current server.
     */
    updateLocaleOptions(state, action: PayloadAction<string[]>) {
      state.localeOptions = action.payload;
    },
  },
});

export const serverActions = {
  ...serverSlice.actions,
};

// SELECTORS

/**
 * Selector for the root ServerState
 */
export function selectServerState(state: ExplorerState): ServerState {
  return state[name];
}

export const selectOlapCubeMap = createSelector(
  selectServerState,
  server => server.cubeMap,
);
export const selectOlapCubeKeys = createSelector(selectOlapCubeMap, getKeys);
export const selectOlapCubeItems = createSelector(selectOlapCubeMap, getValues);
