import {Select} from "@mantine/core";
import React, {memo, useMemo} from "react";
import {useSelector} from "react-redux";
import type {TesseractMeasure} from "../api/tesseract/schema";
import {useTranslation} from "../hooks/translation";
import {selectMeasureMap} from "../state/queries";
import {selectOlapMeasureItems} from "../state/selectors";
import {filterMap} from "../utils/array";
import {keyBy} from "../utils/transform";
import {isActiveItem, shallowEqualExceptFns} from "../utils/validation";

export function SelectMeasure(props: {
  activeOnly?: boolean;
  onItemSelect: (item: TesseractMeasure) => void;
  placeholder?: string;
  selectedItem?: string;
}) {
  const {activeOnly, onItemSelect} = props;

  const {translate: t} = useTranslation();

  const measures = useSelector(selectOlapMeasureItems);
  const measureMap = useSelector(selectMeasureMap);

  const [itemList, changeHandler] = useMemo(() => {
    const list = filterMap(measures, item => {
      const {name} = item;
      if (activeOnly && !isActiveItem(measureMap[name])) return null;
      return {item, label: name, value: name};
    });

    const map = keyBy(list, item => item.value);
    const callback = value => {
      if (value && onItemSelect) onItemSelect(map[value].item);
    };

    return [list, callback];
  }, [measures, measureMap, activeOnly, onItemSelect]);

  return (
    <Select
      data={itemList}
      onChange={changeHandler}
      placeholder={t("selectmeasure_placeholder")}
      searchable={itemList.length > 6}
    />
  );
}

export const MemoSelectMeasure = memo(SelectMeasure, shallowEqualExceptFns);
