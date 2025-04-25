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
    const measure = measures.find(item => item.name === valueProperty);
    const formatterKey = fmt.getFormat(measure || valueProperty);
    const formatter = fmt.getFormatter(formatterKey);
    return {
      formatExample: formatter(12345.6789),
      formatter,
      formatterKey,
      formatterKeyOptions: [{label: t("placeholders.none"), value: "undefined"}].concat(
        fmt
          .getAvailableFormats(measure || valueProperty)
          .map(key => ({label: fmt.getFormatter(key)(12345.6789), value: key}))
      ),
      setFormat: fmt.setFormat
    };
  }, [valueProperty, fmt, t]);
}

export function usePivottedData(
  data: Record<string, any>[],
  colProp: string,
  rowProp: string,
  valProp: string,
  initialState: JSONArrays | null = null
): [JSONArrays | null, Error | null, boolean] {
  const [pivottedData, setPivottedData] = useState(initialState);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPivottedData(initialState);
    setError(null);
    if (data.length !== 0) {
      setIsProcessing(true);
      serializeToArray(data, {colProp, rowProp, valProp})
        .then(result => {
          setPivottedData(result);
          setIsProcessing(false);
        })
        .catch(err => {
          setError(err);
          setIsProcessing(false);
        });
    }
    return () => {
      setPivottedData(null);
      setError(null);
      setIsProcessing(false);
    };
  }, [data, colProp, rowProp, valProp, initialState]);

  return [pivottedData, error, isProcessing];
}

function serializeToArray(
  data: Record<string, unknown>[],
  sides: {rowProp: string; colProp: string; valProp: string}
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
