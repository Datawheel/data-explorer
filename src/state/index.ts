import {queriesActions} from "./queries";

export type {QueriesState} from "./queries";
export type {ServerState} from "./server";
export {
  type ExplorerState,
  type ExplorerStore,
  reducer,
  storeFactory,
  thunkExtraArg,
  useDispatch,
  useSelector
} from "./store";
export {queriesActions};

export type ExplorerActionMap = typeof actions;
export const actions = queriesActions;
