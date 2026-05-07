import {
  IconAdjustments,
  IconAlertCircle,
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsLeftRight,
  IconArrowsSort,
  IconBox,
  IconChevronLeft,
  IconChevronRight,
  IconClipboard,
  IconClipboardCheck,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconFilterOff,
  IconHelpCircle,
  IconInfoCircleFilled,
  IconLanguage,
  IconMathGreater,
  IconMathLower,
  IconPlus,
  IconQuestionMark,
  IconSearch,
  IconSettings,
  IconSortAscendingLetters,
  IconSortAscendingNumbers,
  IconSortDescendingLetters,
  IconSortDescendingNumbers,
  IconStack3,
  IconTrash,
  IconWorld,
  IconWorldWww,
  IconX
} from "@tabler/icons-react";
import React, {useMemo} from "react";
import {createContext} from "../utils/create-context";

export type IconKey =
  | "search"
  | "clear"
  | "collapse-sidebar"
  | "expand-sidebar"
  | "more-options"
  | "download"
  | "copy-data"
  | "copy-link"
  | "copy-link-done"
  | "open-external"
  | "url-indicator"
  | "url-badge"
  | "warning"
  | "warning-solid"
  | "error"
  | "info"
  | "open-help"
  | "help-fallback"
  | "settings"
  | "locale-selector"
  | "dimension-geo"
  | "dimension-time"
  | "dimension-dataset"
  | "drilldowns"
  | "compare-values"
  | "query-options"
  | "add-item"
  | "filter-active"
  | "filter-remove"
  | "operator-gte"
  | "operator-lte"
  | "sort-unsorted"
  | "sort-text-asc"
  | "sort-text-desc"
  | "sort-num-asc"
  | "sort-num-desc"
  | "remove-column"
  | "tour-prev"
  | "tour-next";

export type IconMap = Record<IconKey, React.ComponentType<any>>;

const defaultIconMap: IconMap = {
  "search": IconSearch,
  "clear": IconX,
  "collapse-sidebar": IconChevronLeft,
  "expand-sidebar": IconChevronRight,
  "more-options": IconDotsVertical,
  "download": IconDownload,
  "copy-data": IconCopy,
  "copy-link": IconClipboard,
  "copy-link-done": IconClipboardCheck,
  "open-external": IconExternalLink,
  "url-indicator": IconWorld,
  "url-badge": IconWorldWww,
  "warning": IconAlertTriangle,
  "warning-solid": IconAlertTriangleFilled,
  "error": IconAlertCircle,
  "info": IconInfoCircleFilled,
  "open-help": IconHelpCircle,
  "help-fallback": IconQuestionMark,
  "settings": IconSettings,
  "locale-selector": IconLanguage,
  "dimension-geo": IconWorld,
  "dimension-time": IconClock,
  "dimension-dataset": IconBox,
  "drilldowns": IconStack3,
  "compare-values": IconArrowsLeftRight,
  "query-options": IconAdjustments,
  "add-item": IconPlus,
  "filter-active": IconFilter,
  "filter-remove": IconFilterOff,
  "operator-gte": IconMathGreater,
  "operator-lte": IconMathLower,
  "sort-unsorted": IconArrowsSort,
  "sort-text-asc": IconSortAscendingLetters,
  "sort-text-desc": IconSortDescendingLetters,
  "sort-num-asc": IconSortAscendingNumbers,
  "sort-num-desc": IconSortDescendingNumbers,
  "remove-column": IconTrash,
  "tour-prev": IconArrowLeft,
  "tour-next": IconArrowRight,
};

const [useIconContext, IconContextProvider] = createContext<IconMap>("Icon");

export function IconProvider(props: {
  icons?: Partial<IconMap>;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({...defaultIconMap, ...props.icons}),
    [props.icons]
  );
  return <IconContextProvider value={value}>{props.children}</IconContextProvider>;
}

type IconComponents<Keys extends readonly IconKey[]> = {
  [I in keyof Keys]: React.ComponentType<any>;
};

export function useIcon(key: IconKey): React.ComponentType<any>;
export function useIcon<Keys extends readonly IconKey[]>(keys: [...Keys]): IconComponents<Keys>;
export function useIcon(keyOrKeys: IconKey | readonly IconKey[]): React.ComponentType<any> | React.ComponentType<any>[] {
  const map = useIconContext();
  if (Array.isArray(keyOrKeys)) {
    return (keyOrKeys as IconKey[]).map(key => map[key] ?? (() => null));
  }
  return map[keyOrKeys as IconKey] ?? (() => null);
}
