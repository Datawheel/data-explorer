import {format, formatAbbreviate} from "d3plus-format";
import {useEffect, useMemo, useRef, useState} from "react";
import type {TesseractMeasure} from "../api/tesseract/schema";
import {useSettings} from "./settings";

type FormatterHookContext = {
  /** Stores the format choice made by the user during the session. */
  currentFormats: Record<string, string>;
  /** Returns a list of keys that determine an available formatter function for a `ref` measure name. */
  getAvailableKeys: (ref: string) => string[];
  /** Returns the formatter key currently assigned to a `ref` measure name. */
  getFormatterKey: (ref: string) => string | undefined;
  /** Returns the corresponding formatter function for the provided `key`. */
  getFormatter: (key: string) => import("../utils/types").Formatter;
  /** Saves the user's choice of formatter `key` (by its name) for a `ref` measure name. */
  setFormat: (ref: string, key: string) => void;
};

export const defaultFormatters = {
  undefined: n => n,
  identity: n => `${n}`,
  Decimal: new Intl.NumberFormat(undefined, {useGrouping: false}).format,
  Dollars: new Intl.NumberFormat(undefined, {style: "currency", currency: "USD"}).format,
  Human: n => formatAbbreviate(n, "en-US"),
  Milliards: new Intl.NumberFormat(undefined, {useGrouping: true}).format,
};

export const basicFormatterKeys = ["Decimal", "Milliards", "Human"];

/**
 * React Hook to get a list of available formatters and store the user preferences.
 * Available formatting functions are stored in the `formatters` object, available
 * from the Settings context. The user choice of formatter for each measure is
 * stored in the `currentFormats` object.
 * The resulting object is memoized, so can also be used as dependency.
 */
export function useFormatter(measures: TesseractMeasure[]): FormatterHookContext {
  // Get the formatter functions defined by the user
  const {formatters} = useSettings();

  // This will store the user choices of formatter for the available measures
  const [currentFormats, setCurrentFormats] = useState({});

  // This will silently store the formatters intended by the server schema
  const originKeys = useRef({});

  // We need to capture the default formatter intended for any new measure
  // Since measure arrays come from the server schema, the containing array
  // can be considered stable to use as dependency. We also want to refresh the
  // choice if the user changes the cube and there's a measure with the same name.
  useEffect(() => {
    // Create an array of tuples, containing (measure name, formatter key)
    const tuplesRefKey = measures.map(item => {
      const {annotations: ann} = item;
      return [item.name, ann.format_template || ann.units_of_measurement] as const;
    });
    // Convert the tuple array into Record<measure name, formatter key>
    const record = Object.fromEntries(tuplesRefKey);
    // Save the record, then make sure it triggers a render
    originKeys.current = record;
    setCurrentFormats(record);
  }, [measures]);

  return useMemo(
    () => ({
      currentFormats,
      getAvailableKeys(ref) {
        const originKey = originKeys.current[ref];
        return originKey && !basicFormatterKeys.includes(originKey)
          ? [originKey].concat(basicFormatterKeys)
          : basicFormatterKeys;
      },
      getFormatterKey(ref) {
        return currentFormats[ref] || originKeys.current[ref];
      },
      getFormatter(key) {
        // If formatter key is three uppercase letters, assume currency
        if (/^[A-Z]{3}$/.test(key)) {
          return (
            formatters[key] ||
            (key => {
              const options = {style: "currency", currency: key};
              const formatter = new Intl.NumberFormat(undefined, options).format;
              formatters[key] = formatter;
              return formatter;
            })(key)
          );
        }
        try {
          return formatters[key] || defaultFormatters[key] || format(key);
        } catch {
          console.debug(`Formatter not configured: "${key}"`);
          return defaultFormatters.identity;
        }
      },
      setFormat(ref, formatterKey) {
        setCurrentFormats({...currentFormats, [ref]: formatterKey});
      },
    }),
    [currentFormats],
  );
}
