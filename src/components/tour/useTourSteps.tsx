  
import React, {useMemo} from "react";
import FirstStep from "./FirstStep";
import TourStep from "./TourStep";
import LastStep from "./LastStep";
import { ExplorerStepType, TourConfig } from "./types";

import { useTranslation } from "../../hooks/translation";

const click = (selector) => () => {
  const element = document.querySelector(selector);
  element?.click();
};

export const useTourSteps = (tourConfig: TourConfig): ExplorerStepType[] => {
    const {translate: t} = useTranslation();
    const steps: ExplorerStepType[] = useMemo(() => [
    {
        selector: "document",
        content: <FirstStep introImage={tourConfig.introImage} />,
        position: "center",
    },
    {
      selector: '#dex-select-locale',
      content: 
      <TourStep
        title={t("tour.steps.locale.title")}
        texts={[
          t("tour.steps.locale.text1"),
          t("tour.steps.locale.text2")
        ]}
      />,
    },
    {
      selector: '#dex-select-cube-area',
      content: 
      <TourStep
        title={t("tour.steps.dataset.title")}
        texts={[
          t("tour.steps.dataset.text1"),
          t("tour.steps.dataset.text2")
        ]}
      />,
    },
    {
      selector: '#dex-search',
      content: 
      <TourStep
        title={t("tour.steps.search.title")}
        texts={[
          t("tour.steps.search.text1"),
          t("tour.steps.search.text2")
        ]}
      />,
    },
    {
      selector: '#dex-table',
      content: 
      <TourStep
        title={t("tour.steps.table.title")}
        texts={[
          t("tour.steps.table.text1"),
          t("tour.steps.table.text2")
        ]}
      />,
    },
    {
      selector: '#dex-column-drawer-body',
      actionBefore: click("#dex-column-btn"),
      stepInteraction: true,
      content: 
      <TourStep
        title={t("tour.steps.columns.title")}
        texts={[
          t("tour.steps.columns.text1"),
          t("tour.steps.columns.text2")
        ]}
      />,
    },
    {
      selector: '.dex-dimension-control',
      actionBefore:
        click(".dex-level-filter"),
      actionAfter: click("#dex-column-drawer-close"),
      stepInteraction: true,
      content: 
      <TourStep
        title={t("tour.steps.filters.title")}
        texts={[
          t("tour.steps.filters.text1"),
          t("tour.steps.filters.text2")
        ]}
      />,
    },
    {
      selector: '#dex-btn-group-download',
      content: 
      <TourStep
        title={t("tour.steps.download.title")}
        texts={[t("tour.steps.download.text1")]}
      />,
    },
    {
      selector: '#dex-api-btn',
      content: 
      <TourStep
        title={t("tour.steps.api.title")}
        texts={[t("tour.steps.api.text1")]}
      />,
    },
    ...(tourConfig.extraSteps || []),
    {
      selector: "viewport",
      content: <LastStep t={t} />,
      position: "center",
    },
    // ...
  ], [tourConfig.extraSteps]);

  return steps;
}