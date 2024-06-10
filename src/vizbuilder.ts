import type {Translation} from "@datawheel/vizbuilder";

export {createVizbuilderView} from "./vizbuilder/components/VizbuilderView";

declare module "@datawheel/data-explorer" {
  interface TranslationDict {
    vizbuilder: Translation;
  }
}
