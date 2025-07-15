import type {Chart} from "@datawheel/vizbuilder";
import {useVizbuilderContext} from "@datawheel/vizbuilder/react";
import {Box, Button, CopyButton, Group, Paper, Stack} from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCheck,
  IconDownload,
  IconPhotoDown,
  IconShare,
  IconVectorTriangle,
} from "@tabler/icons-react";
import {saveElement} from "d3plus-export";
import React, {useMemo, useRef, useState} from "react";
import {useInView} from "react-intersection-observer";
import {useVizbuilderTranslation} from "../../hooks/translation";
import {useD3plusConfig} from "../hooks/useD3plusConfig";

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle,
};

export function ChartCard(props: {
  /** The information needed to build a specific chart configuration. */
  chart: Chart;

  /** Class attribute for the wrapper div. */
  className?: string;

  /** Optional height override for the card. */
  height?: number;

  /** Flag to render the card in full feature mode. */
  isFullMode?: boolean;

  /**
   * An event handler to call when the user click the 'focus' button.
   * If not defined, the button will not be rendered.
   */
  onFocus?: () => void;

  /** Style attribute for the wrapper div. */
  style?: React.CSSProperties;
}) {
  const {chart, isFullMode, onFocus, height} = props;
  const {dataset} = chart.datagroup;

  const {translate} = useVizbuilderTranslation();

  const {downloadFormats, ErrorBoundary, showConfidenceInt} = useVizbuilderContext();

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
    showConfidenceInt,
    t: translate,
  });

  const downloadButtons = useMemo(() => {
    if (!config) return null;

    // Sanitize filename for Windows and Unix
    const filename = (
      typeof config.title === "function" ? config.title(dataset) : config.title || ""
    )
      .replace(/[^\w]/g, "_")
      .replace(/[_]+/g, "_");

    return downloadFormats.map(format => {
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
                {background: getBackground(svgElement)},
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
  }, [config, dataset, downloadFormats]);

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
        {isFullMode ? translate("action_close") : translate("action_enlarge")}
      </Button>
    );
  }, [isFullMode, translate, onFocus]);

  const shareButton = useMemo(() => {
    return (
      <CopyButton value={window.location.href} timeout={1500}>
        {({copied, copy}) => (
          <Button
            compact
            leftIcon={copied ? <IconCheck size={16} /> : <IconShare size={16} />}
            onClick={copy}
            size="sm"
            variant={copied ? "filled" : "light"}
          >
            {copied ? translate("share_copied") : translate("action_share")}
          </Button>
        )}
      </CopyButton>
    );
  }, [translate]);

  if (!ChartComponent || !config) return null;

  const resolvedHeight = height ? height : isFullMode ? "calc(100vh - 3rem)" : 400;

  return (
    <ErrorBoundary>
      <Paper
        className={props.className}
        w="100%"
        style={{overflow: "hidden", height: resolvedHeight, ...props.style}}
      >
        <Stack spacing="xs" p="xs" style={{position: "relative"}} h="100%" w="100%">
          <Group position="center" spacing="xs" align="center">
            {isFullMode && shareButton}
            {downloadButtons}
            {onFocus && focusButton}
          </Group>
          <Box
            style={{flex: "1 1 auto"}}
            ref={setRefs}
            sx={{"& > .viz": {height: "100%"}}}
          >
            {ChartComponent && (inView || hasBeenInView) ? (
              <ChartComponent config={config} />
            ) : (
              <div style={{height: "100%", width: "100%"}} />
            )}
          </Box>
        </Stack>
      </Paper>
    </ErrorBoundary>
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
