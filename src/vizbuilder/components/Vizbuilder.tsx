import {type Dataset, generateCharts} from "@datawheel/vizbuilder";
import {useVizbuilderContext} from "@datawheel/vizbuilder/react";
import {Flex, Loader, Modal, Text, Title, createStyles} from "@mantine/core";
import {IconCircleOff} from "@tabler/icons-react";
import cls from "clsx";
import React, {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useSettings} from "../../hooks/settings";
import {useVizbuilderTranslation} from "../../hooks/translation";
import {selectCurrentQueryItem} from "../../state/queries";
import {asArray} from "../../utils/array";
import {ChartCard} from "./ChartCard";

const useStyles = createStyles(theme => ({
  wrapper: {
    height: "100%",
  },
  grid: {
    padding: theme.spacing.xl,
    display: "grid",
    gridAutoRows: "minmax(200px, auto)",
    gap: theme.spacing.xl,
    gridTemplateColumns: "1fr 1fr",
    [theme.fn.smallerThan("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  itemLarge: {
    gridRow: "auto",
    gridColumn: "auto",
  },
  itemSmallTop: {
    gridRow: "auto",
    gridColumn: "auto",
  },
  itemSmallBottom: {
    gridRow: "auto",
    gridColumn: "auto",
  },
  // for single chart
  fill: {
    gridColumn: "1",
    gridRow: "1",
    height: "100%",
    width: "100%",
    [theme.fn.largerThan("md")]: {
      gridColumn: "1 / span 2",
      gridRow: "1 / span 2",
    },
  },
}));

export type VizbuilderProps = React.ComponentProps<typeof Vizbuilder>;

/** */
export function Vizbuilder(props: {
  /**
   * The datasets to extract the charts from.
   */
  datasets: Dataset | Dataset[];

  /**
   * Custom className to apply to the component wrapper.
   *
   * @default
   */
  className?: string;

  /**
   * A ReactNode to render above the main charts area.
   *
   * @default undefined
   */
  customHeader?: React.ReactNode;

  /**
   * A ReactNode to render under the main charts area.
   *
   * @default undefined
   */
  customFooter?: React.ReactNode;
}) {
  const datasets = useMemo(() => asArray(props.datasets), [props.datasets]);

  const {t} = useVizbuilderTranslation();

  const {
    chartLimits,
    chartTypes,
    datacap,
    getTopojsonConfig,
    ErrorBoundary,
    NonIdealState,
  } = useVizbuilderContext();

  const {actions} = useSettings();

  const queryItem = useSelector(selectCurrentQueryItem);

  const {classes, cx} = useStyles();

  const closeModal = useCallback(() => actions.updateChart(""), []);

  // Compute possible charts
  const charts = useMemo(() => {
    const charts = generateCharts(datasets, {
      chartLimits,
      chartTypes,
      datacap,
      getTopojsonConfig,
    });
    return Object.fromEntries(charts.map(chart => [chart.key, chart]));
  }, [chartLimits, chartTypes, datacap, datasets, getTopojsonConfig]);

  const content = useMemo(() => {
    const isLoading = datasets.some(dataset => Object.keys(dataset.columns).length === 0);
    if (isLoading) {
      console.debug("Loading datasets...", datasets);
      return (
        <Flex justify="center" align="center" direction="column">
          <Loader size="xl" />
          <Title mt="md" order={4}>
            {t("transient.title_loading")}
          </Title>
        </Flex>
      );
    }

    const chartList = Object.values(charts).slice(0, 10);

    if (chartList.length === 0) {
      if (datasets.length === 1 && datasets[0].data.length === 1) {
        return (
          <Flex justify="center" align="center" direction="column" w="50%">
            <IconCircleOff size={92} />
            <Title mt="md" mb="md" order={4}>
              {t("transient.title_one_row")}
            </Title>
          </Flex>
        );
      }

      return (
        <Flex justify="center" align="center" direction="column" w="50%">
          <IconCircleOff size={92} />
          <Title mt="md" mb="md" order={4}>
            {t("vizbuilder.transient.title_empty")}
          </Title>
          <Text>{t("transient.description_empty")}</Text>
        </Flex>
      );
    }

    const isSingleChart = chartList.length === 1;

    return (
      <ErrorBoundary>
        <div className={cx(classes.grid, {[classes.fill]: isSingleChart})}>
          {chartList.map((chart, idx) => {
            let className = classes.fill;
            if (!isSingleChart) {
              // For each group of 3 charts, assign grid positions
              const names = [
                classes.itemLarge,
                classes.itemSmallTop,
                classes.itemSmallBottom,
              ];
              className = names[idx % 3];
            }
            return (
              <ChartCard
                key={chart.key}
                chart={chart}
                onFocus={() => actions.updateChart(chart.key)}
                height={isSingleChart ? 600 : undefined}
                className={className}
              />
            );
          })}
        </div>
      </ErrorBoundary>
    );
  }, [charts, classes, datasets, t, cx, ErrorBoundary]);

  const currentChart = queryItem?.chart || "";
  const chart = charts[currentChart];

  return (
    <div className={cls("vb-wrapper", classes.wrapper, props.className)}>
      {props.customHeader}
      {content}
      {props.customFooter}
      <Modal
        centered
        onClose={closeModal}
        opened={currentChart !== ""}
        padding={0}
        size="calc(100vw - 3rem)"
        styles={{
          content: {maxHeight: "none !important"},
          inner: {padding: "0 !important"},
        }}
        withCloseButton={false}
      >
        {chart && <ChartCard chart={chart} onFocus={closeModal} isFullMode />}
      </Modal>
    </div>
  );
}
