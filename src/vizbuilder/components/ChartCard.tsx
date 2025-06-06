import type {Chart, D3plusConfig} from "@datawheel/vizbuilder";
import {Box, Button, Group, Paper, Stack} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCheck,
  IconDownload,
  IconPhotoDown,
  IconShare,
  IconVectorTriangle
} from "@tabler/icons-react";
import {saveElement} from "d3plus-export";
import React, {useMemo, useRef, useState} from "react";
import type {TesseractMeasure} from "../../api/tesseract/schema";
import {useTranslation} from "../../hooks/translation";
import {asArray as castArray} from "../../utils/array";
import {useD3plusConfig} from "../hooks/useD3plusConfig";
import {ErrorBoundary} from "./ErrorBoundary";
import {useClipboard} from "@mantine/hooks";
import {useInView} from "react-intersection-observer";

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle
};

export function ChartCard(props: {
  /** The information needed to build a specific chart configuration. */
  chart: Chart;

  /**
   * An accessor that generates custom defined d3plus configs by measure name.
   * Has priority over all other configs.
   */
  measureConfig: (measure: TesseractMeasure) => Partial<D3plusConfig>;

  /** A list of the currently enabled formats to download. Options are "PNG" and "SVG". */
  downloadFormats?: string[];

  /** Flag to render the card in full feature mode. */
  isFullMode?: boolean;

  /**
   * An event handler to call when the user click the 'focus' button.
   * If not defined, the button will not be rendered.
   */
  onFocus?: () => void;

  /** Toggles confidence intervals/margins of error when available. */
  showConfidenceInt?: boolean;

  /**
   * A global d3plus config that gets applied on all charts.
   * Has priority over the individually generated configs per chart,
   * but can be overridden by internal working configurations.
   */
  userConfig?: (chart: Chart) => Partial<D3plusConfig>;

  /** Optional height override for the card. */
  height?: number;
}) {
  const {chart, downloadFormats, isFullMode, onFocus, showConfidenceInt, height} = props;

  const {translate} = useTranslation();

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const {ref: inViewRef, inView} = useInView({triggerOnce: false, threshold: 0});
  const [hasBeenInView, setHasBeenInView] = useState(false);

  React.useEffect(() => {
    if (inView && !hasBeenInView) {
      setHasBeenInView(true);
    }
  }, [inView, hasBeenInView]);

  const setRefs = (el: HTMLDivElement | null) => {
    nodeRef.current = el;
    inViewRef(el);
  };

  const [ChartComponent, config] = useD3plusConfig(chart, {
    fullMode: !!isFullMode,
    showConfidenceInt: !!showConfidenceInt,
    getMeasureConfig: props.measureConfig,
    t: translate
  });

  const clipboard = useClipboard();

  const [isShared, setIsShared] = useState(false);

  const downloadButtons = useMemo(() => {
    // Sanitize filename for Windows and Unix
    const filename = (typeof config.title === "function" ? config.title() : config.title || "")
      .replace(/[^\w]/g, "_")
      .replace(/[_]+/g, "_");

    return castArray(downloadFormats).map(format => {
      const formatLower = format.toLowerCase();
      const Icon = iconByFormat[formatLower] || IconDownload;
      return (
        <Button
          key={format}
          compact
          leftIcon={<Icon size={16} />}
          onClick={() => {
            const {current: boxElement} = nodeRef;
            const svgElement = boxElement?.querySelector("svg");
            if (svgElement) {
              saveElement(
                svgElement,
                {filename, type: formatLower},
                {background: getBackground(svgElement)}
              );
            }
          }}
          size="sm"
          variant="light"
        >
          {format.toUpperCase()}
        </Button>
      );
    });
  }, [config, downloadFormats]);

  const focusButton = useMemo(() => {
    const Icon = isFullMode ? IconArrowsMinimize : IconArrowsMaximize;
    return (
      <Button
        compact
        leftIcon={<Icon size={16} />}
        onClick={onFocus}
        size="sm"
        variant={isFullMode ? "filled" : "light"}
      >
        {isFullMode ? translate("vizbuilder.action_close") : translate("vizbuilder.action_enlarge")}
      </Button>
    );
  }, [isFullMode, translate, onFocus]);

  const shareButton = useMemo(() => {
    return (
      <Button
        compact
        leftIcon={isShared ? <IconCheck size={16} /> : <IconShare size={16} />}
        onClick={() => {
          clipboard.copy(window.location.href);
          setIsShared(true);
          setTimeout(() => setIsShared(false), 1500);
        }}
        size="sm"
        variant={isShared ? "filled" : "light"}
      >
        {isShared ? translate("vizbuilder.share_copied") : translate("vizbuilder.action_share")}
      </Button>
    );
  }, [clipboard, translate, isShared]);

  const resolvedHeight = height ? height : isFullMode ? "calc(100vh - 3rem)" : 400;

  if (!ChartComponent) return null;

  return (
    <Paper h={resolvedHeight} w="100%" style={{overflow: "hidden"}}>
      <ErrorBoundary>
        <Stack spacing={0} h={resolvedHeight} style={{position: "relative"}} w="100%">
          <Group position="center" p="xs" spacing="xs" align="center">
            {isFullMode && shareButton}
            {downloadButtons}
            {onFocus && focusButton}
          </Group>
          <Box style={{flex: "1 1 auto"}} ref={setRefs} pb="xs" px="xs">
            {ChartComponent && (inView || hasBeenInView) ? (
              <ChartComponent config={config} />
            ) : (
              <div style={{height: "100%", width: "100%"}} />
            )}
          </Box>
        </Stack>
      </ErrorBoundary>
    </Paper>
  );
}

const getBackground = node => {
  if (node.nodeType !== Node.ELEMENT_NODE) return "white";
  const styles = window.getComputedStyle(node);
  const color = styles.getPropertyValue("background-color");
  return color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent"
    ? color
    : getBackground(node.parentNode);
};
