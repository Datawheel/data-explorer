import {Stack} from "@mantine/core";
import React from "react";
import {useTranslation} from "../hooks/translation";
import {LayoutParamsArea} from "./LayoutParamsArea";
import {PaginationInput} from "./PaginationInput";
import {SortingInput} from "./SortingInput";

export const AreaOptions = () => {
  const {translate: t} = useTranslation();

  return (
    <LayoutParamsArea
      id="options"
      title={t("params.title_area_options")}
      tooltip={t("params.tooltip_area_options")}
      value="options"
    >
      <Stack spacing="xs">
        <SortingInput />
        <PaginationInput />
      </Stack>
    </LayoutParamsArea>
  );
};
