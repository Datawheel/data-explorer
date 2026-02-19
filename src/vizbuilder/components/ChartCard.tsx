import type {Chart} from "@datawheel/vizbuilder";
import {
  ErrorBoundary,
  useD3plusConfig,
  useVizbuilderContext,
} from "@datawheel/vizbuilder/react";
import {Box, Button, CopyButton, Group, LoadingOverlay, Paper, Stack} from "@mantine/core";
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
import React, {useMemo, useRef, useState, memo} from "react";
import {useInView} from "react-intersection-observer";

const iconByFormat = {
  jpg: IconPhotoDown,
  png: IconPhotoDown,
  svg: IconVectorTriangle,
};

const ChartRenderer = memo((props: {
  ChartComponent: React.ComponentType<{config: any}>;
  config: any;
  containerRef: React.RefObject<HTMLDivElement>;
  overlayRef: React.RefObject<HTMLDivElement>;
  onReady: () => void;
}) => {
  const {ChartComponent, config, containerRef, overlayRef, onReady} = props;

  React.useEffect(() => {
    const box = containerRef.current;
    if (!box) return;

    const checkSvg = () => {
      const svg = box.querySelector("svg");
      if (svg) {
        // Direct DOM manipulation to hide the loader instantly, 
        // bypassing React's main-thread blocking during d3 rendering.
        if (overlayRef.current) {
          overlayRef.current.style.display = "none";
        }
        onReady();
        return true;
      }
      return false;
    };

    if (checkSvg()) return;

    const observer = new MutationObserver(() => {
      if (checkSvg()) observer.disconnect();
    });

    observer.observe(box, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [containerRef, overlayRef, onReady]);

  return <ChartComponent config={config} />;
});

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

  const {CardErrorComponent, downloadFormats, translate} = useVizbuilderContext();

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

  const [ChartComponent, config] = useD3plusConfig(chart, {fullMode: !!isFullMode});

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

  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRenderChart, setShouldRenderChart] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state when chart changes
  React.useEffect(() => {
    setIsLoaded(false);
    setShouldRenderChart(false);
    if (overlayRef.current) {
      overlayRef.current.style.display = "block";
    }
  }, [chart.key]);

  React.useEffect(() => {
    if (ChartComponent && (inView || hasBeenInView) && !shouldRenderChart) {
      // Guaranteed 1s delay to ensure the user sees the loader animation
      // before the JS thread is hijacked by the heavy d3 processing.
      const timer = setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            setShouldRenderChart(true);
          });
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ChartComponent, inView, hasBeenInView, shouldRenderChart]);

  // Use MutationObserver to detect when the SVG is actually added to the DOM
  React.useEffect(() => {
    const box = nodeRef.current;
    if (!box || !shouldRenderChart || isLoaded) return;

    const observer = new MutationObserver(() => {
      const svg = box.querySelector("svg");
      if (svg) {
        window.requestAnimationFrame(() => setIsLoaded(true));
        observer.disconnect();
      }
    });

    observer.observe(box, {childList: true, subtree: true});

    // Initial check in case it rendered instantly (unlikely but possible)
    if (box.querySelector("svg")) {
      setIsLoaded(true);
    }

    return () => observer.disconnect();
  }, [shouldRenderChart, isLoaded]);

  if (!ChartComponent || !config) return null;

  const resolvedHeight = height ? height : isFullMode ? "calc(100vh - 3rem)" : "calc((80vh - 4rem) / 2)";

  return (
    <ErrorBoundary ErrorContent={CardErrorComponent}>
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
            style={{flex: "1 1 auto", position: "relative"}}
            ref={setRefs}
            sx={{"& > .viz": {height: "100%"}}}
          >
            <Box
              ref={overlayRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
              }}
            >
              <LoadingOverlay
                visible={!isLoaded}
                overlayBlur={2}
                transitionDuration={0}
              />
            </Box>
            {ChartComponent && (inView || hasBeenInView) && shouldRenderChart ? (
              <ChartRenderer
                ChartComponent={ChartComponent}
                config={config}
                containerRef={nodeRef}
                overlayRef={overlayRef}
                onReady={() => setIsLoaded(true)}
              />
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
