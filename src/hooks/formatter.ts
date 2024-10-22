import {format, formatAbbreviate} from "d3plus-format";
import {useMemo, useRef, useState} from "react";
import type {TesseractMeasure} from "../api/tesseract/schema";
import {useSettings} from "./settings";

type Format = string;

type Formatter = (value: number | null, locale?: string) => string;

interface FormatterContextValue {
  /** Stores the format choice made by the user during the session. */
  currentFormats: Record<string, string>;
  /** Returns a list of keys that determine an available Format for a measure. */
  getAvailableFormats: (measure: string | TesseractMeasure) => string[];
  /** Returns the formatter key currently assigned to a `ref` measure name. */
  getFormat: (ref: string | TesseractMeasure, defaultValue?: string) => string;
  /** Saves the user's choice of formatter `key` (by its name) for a `ref` measure name. */
  setFormat: (ref: string | TesseractMeasure, key: string) => void;
  /** Returns the corresponding formatter function for the provided `key`. */
  getFormatter: (item: string | TesseractMeasure) => Formatter;
}

export const defaultFormatters = {
  undefined: n => n,
  identity: n => `${n}`,
  Decimal: new Intl.NumberFormat(undefined, {useGrouping: false}).format,
  Dollars: new Intl.NumberFormat(undefined, {style: "currency", currency: "USD"}).format,
  Human: n => formatAbbreviate(n, "en-US"),
  Milliards: new Intl.NumberFormat(undefined, {useGrouping: true}).format,
  Million: new Intl.NumberFormat(undefined, {useGrouping: true}).format,
};

export const basicFormatterKeys = ["Decimal", "Milliards", "Human"];

/**
 * React Hook to get a list of available formatters and store the user preferences.
 * Available formatting functions are stored in the `formatters` object, available
 * from the Settings context. The user choice of formatter for each measure is
 * stored in the `currentFormats` object.
 * The resulting object is memoized, so can also be used as dependency.
 */
export function useFormatter() {
  // Get the Formatter functions defined by the user
  const {formatters} = useSettings();

  // This will store the user choices of Format for the measures used in the session
  const [formatMap, setFormatMap] = useState<Record<string, Format>>({});

  // This will silently store the Formatters intended by the server schema
  const formatterMap = useRef(formatters);

  return useMemo<FormatterContextValue>(() => {
    return {
      currentFormats: formatMap,
      getAvailableFormats(measure) {
        const formatterKeys = basicFormatterKeys.slice();
        if (typeof measure !== "string") {
          const {format_template, units_of_measurement} = measure.annotations;
          units_of_measurement && formatterKeys.unshift(units_of_measurement);
          format_template && formatterKeys.unshift(format_template);
        }
        return formatterKeys;
      },
      setFormat,
      getFormat,
      getFormatter(item) {
        const key = typeof item === "object" ? getFormat(item) : item;
        let formatter = formatterMap.current[key] || defaultFormatters[key];
        if (formatter) return formatter;

        // If formatter key is three uppercase letters, assume currency
        if (/^[A-Z]{3}$/.test(key)) {
          const formatter = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: key,
          }).format;
          formatterMap.current[key] = formatter;
          return formatter;
        }

        // At this point formatter key is assumed a template
        try {
          formatter = format(key);
        } catch {
          console.warn(`Formatter not configured: "${key}"`);
          formatter = defaultFormatters.identity;
        }
        formatterMap.current[key] = formatter;
        return formatter;
      },
    };

    function setFormat(measure: string | TesseractMeasure, format: Format) {
      const key = typeof measure === "string" ? measure : measure.name;
      setFormatMap(formatMap => ({...formatMap, [key]: format}));
    }

    function getFormat(
      measure: string | TesseractMeasure,
      defaultValue = "identity",
    ): Format {
      if (typeof measure === "string") return formatMap[measure] || defaultValue;
      const {format_template, units_of_measurement} = measure.annotations;
      return (
        formatMap[measure.name] || format_template || units_of_measurement || defaultValue
      );
    }
  }, [formatMap]);
}
