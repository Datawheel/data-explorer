export {DebugView} from "./components/DebugView";
export {ExplorerComponent as Explorer} from "./components/Explorer";
export {PivotView} from "./components/PivotView";
export {TableView} from "./components/TableView";
export {SettingsConsumer, useSettings} from "./hooks/settings";
export {ToolbarButton} from "./components/Toolbar";
export {TranslationConsumer, type TranslationDict, defaultTranslation as translationDict, useTranslation} from "./hooks/translation";
export {type ExplorerState, reducer as explorerReducer, thunkExtraArg as explorerThunkExtraArg} from "./state";
export type {ViewProps} from "./utils/types";

import type {Translation} from "@datawheel/vizbuilder";

export {createVizbuilderView} from "./vizbuilder/components/VizbuilderView";

// Tour
export {default as TourStep} from "./components/tour/TourStep";
export {type ExplorerStepType} from "./components/tour/types";

declare module "@datawheel/data-explorer" {
  interface TranslationDict {
    vizbuilder: Translation;
  }
}