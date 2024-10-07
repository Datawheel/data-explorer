  
import React from "react";
import FirstStep from "./FirstStep";
import SlideStep from "./SlideStep";
import LastStep from "./LastStep";

import { useTranslation } from "../../hooks/translation";
import {StepType} from "@reactour/tour"
const click = (selector) => () => {
  const element = document.querySelector(selector);
  element?.click();
};

interface ExplorerStepType extends StepType{
  actionBefore?: () => void;
}
export const useTourSteps = (extraSteps: ExplorerStepType[] = []): ExplorerStepType[] => {
    const {translate: t} = useTranslation();
    return [
    {
        selector: "document",
        content: <FirstStep />,
        position: "center",
    },
    {
      selector: '#dex-select-locale',
      content: 
      <SlideStep
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
      <SlideStep
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
      <SlideStep
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
      <SlideStep
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
      <SlideStep
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
      <SlideStep
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
      <SlideStep
        title={t("tour.steps.download.title")}
        texts={[t("tour.steps.download.text1")]}
      />,
    },
    {
      selector: '#dex-api-btn',
      content: 
      <SlideStep
        title={t("tour.steps.api.title")}
        texts={[t("tour.steps.api.text1")]}
      />,
    },
    ...extraSteps,
    {
      selector: "viewport",
      content: <LastStep t={t} />,
      position: "center",
    },
    // ...
  ]
}