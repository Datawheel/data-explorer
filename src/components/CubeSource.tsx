import {Anchor, Text, TextProps} from "@mantine/core";
import React from "react";
import {useSelector} from "react-redux";
import {useTranslation} from "../hooks/translation";
import {getAnnotation} from "../utils/string";
import {selectLocale} from "../state/queries";
import type {Annotated} from "../utils/types";
import {useSelectedItem} from "../hooks/useQueryApi";

export function CubeAnnotation(
  props: TextProps & {
    annotation: string;
    item: Annotated;
    locale: string;
  }
) {
  const {annotation, item, locale, ...textProps} = props;
  const content = getAnnotation(item, annotation, locale);
  return content ? (
    <Text component="p" {...textProps}>
      {content}
    </Text>
  ) : null;
}

/** */
export function CubeSourceAnchor(
  props: TextProps & {
    item: Annotated;
    locale: string;
  }
) {
  const {item, locale, ...textProps} = props;
  const {translate: t} = useTranslation();

  const srcName = getAnnotation(item, "source_name", locale);
  const srcLink = getAnnotation(item, "source_link", locale);

  if (!srcName) return null;

  return (
    <Text component="p" {...textProps}>
      {`${t("params.label_source")}: `}
      {srcLink ? <Anchor href={srcLink} target="_blank">{srcName}</Anchor> : <Text span>{srcName}</Text>}
    </Text>
  );
}

export default function CubeSource() {
  const selectedItem = useSelectedItem();
  const {code: locale} = useSelector(selectLocale);
  return (
    selectedItem && (
      <Text sx={{"& p": {margin: 0}}}>
        <CubeAnnotation fz="xs" fw="bold" annotation="table" item={selectedItem} locale={locale} />
        <CubeAnnotation
          annotation="description"
          className="dex-cube-description"
          item={selectedItem}
          locale={locale}
        />
        <CubeSourceAnchor item={selectedItem} locale={locale} fz="xs" />
        <CubeAnnotation
          annotation="source_description"
          className="dex-cube-srcdescription"
          fz="xs"
          item={selectedItem}
          locale={locale}
        />
      </Text>
    )
  );
}
