import {type PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit";
import type {TesseractCube} from "../api";
import {getKeys, getValues} from "../utils/object";
import type {ExplorerState} from "./store";

export interface ServerState {
  cubeMap: Record<string, TesseractCube>;
  locale: string;
  localeOptions: string[];
  online: boolean | undefined;
  url: string;
}

const name = "explorerServer";

const initialState: ServerState = {
  cubeMap: {},
  locale: "en",
  localeOptions: ["en"],
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

    resetServer(state, action: PayloadAction<void>) {
      return {...initialState};
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
