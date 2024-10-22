import {useEffect, useMemo, useState} from "react";
import type {TesseractMeasure} from "../api/tesseract/schema.js";
import PivotWorker from "../utils/pivot.worker.js";
import type {JSONArrays} from "../utils/types.js";
import {useFormatter} from "./formatter.js";
import {useTranslation} from "./translation.js";

/**
 * Encapsulates the logic for the formatting in this component.
 */
export function useFormatParams(measures: TesseractMeasure[], valueProperty: string) {
  const {translate: t} = useTranslation();
  const fmt = useFormatter();

  return useMemo(() => {
    const formatterKey = fmt.getFormat(valueProperty);
    const formatter = fmt.getFormatter(formatterKey);
    return {
      formatExample: formatter(12345.6789),
      formatter,
      formatterKey,
      formatterKeyOptions: [{label: t("placeholders.none"), value: "undefined"}].concat(
        fmt
          .getAvailableFormats(valueProperty)
          .map(key => ({label: fmt.getFormatter(key)(12345.6789), value: key})),
      ),
      setFormat: fmt.setFormat,
    };
  }, [valueProperty, fmt, t]);
}

export function usePivottedData(
  data: Record<string, any>[],
  colProp: string,
  rowProp: string,
  valProp: string,
  initialState: JSONArrays | null = null,
): [JSONArrays | null, Error | null] {
  const [pivottedData, setPivottedData] = useState(initialState);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPivottedData(initialState);
    setError(null);

    serializeToArray(data, {colProp, rowProp, valProp}).then(setPivottedData, setError);

    return () => {
      setPivottedData(null);
      setError(null);
    };
  }, [data, colProp, rowProp, valProp]);

  return [pivottedData, error];
}

function serializeToArray(
  data: Record<string, unknown>[],
  sides: {rowProp: string; colProp: string; valProp: string},
): Promise<JSONArrays> {
  return new Promise((resolve, reject) => {
    const worker = new PivotWorker();
    worker.onmessage = evt => {
      resolve(evt.data);
      worker.terminate();
    };
    worker.onerror = error => {
      reject(error);
      worker.terminate();
    };

    try {
      worker.postMessage({data, sides});
    } catch (err) {
      reject(err);
    }
  });
}
