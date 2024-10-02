import React, {createContext, useContext, useMemo, useState} from "react";
import {ComplexityModuleClient} from "./complexity/client";
import {TesseractModuleClient} from "./tesseract/client";

/**
 * Note:
 * The value in `dataLocale` should be considered the source of truth for
 * the locale to use on any data fetching operation.
 */

interface LogicLayerContextValue {
  dataLocale: string;
  setDataLocale: (value: string) => void;
  tesseract: TesseractModuleClient;
  complexity: ComplexityModuleClient;
}

const LogicLayerContext = createContext<LogicLayerContextValue | null>(null);

export function LogicLayerProvider(props: {
  children: React.ReactNode;
  defaultDataLocale?: string;
  serverURL: string;
  serverConfig?: RequestInit;
}) {
  const [dataLocale, setDataLocale] = useState(props.defaultDataLocale || "");

  const value = useMemo(() => {
    const tesseract = new TesseractModuleClient(props.serverURL, props.serverConfig);
    const complexity = new ComplexityModuleClient(props.serverURL, props.serverConfig);
    return {dataLocale, setDataLocale, tesseract, complexity};
  }, [props.serverURL, props.serverConfig, dataLocale]);

  return (
    <LogicLayerContext.Provider value={value}>
      {props.children}
    </LogicLayerContext.Provider>
  );
}

export function useLogicLayer(): LogicLayerContextValue {
  const context = useContext(LogicLayerContext);
  if (context == null) {
    throw new Error("Hook useLogicLayer must be used inside a LogicLayerProvider node.");
  }
  return context;
}
