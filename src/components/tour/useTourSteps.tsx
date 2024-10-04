  
import React from "react";
import FirstStep from "./FirstStep";
import SlideStep from "./SlideStep";
import { useTranslation } from "../../hooks/translation";

export const useTourSteps = () => {
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

    // ...
  ]
}