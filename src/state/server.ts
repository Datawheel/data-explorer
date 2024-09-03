import type {PlainCube} from "@datawheel/olap-client";
import {createSelector, createSlice, type PayloadAction} from "@reduxjs/toolkit";
import {getKeys, getValues} from "../utils/object";
import type {ExplorerState} from "./store";

export interface ServerState {
  cubeMap: Record<string, PlainCube>;
  localeOptions: string[];
  online: boolean | undefined;
  url: string;
  version: string;
}

const name = "explorerServer";

const initialState: ServerState = {
  cubeMap: {},
  localeOptions: ["en"],
  online: undefined,
  url: "",
  version: "",
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
    updateLocaleList(state, action: PayloadAction<string[]>) {
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
