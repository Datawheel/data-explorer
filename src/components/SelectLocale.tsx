import {Box, Input, MantineTheme, CSSObject, Tooltip, useMantineTheme} from "@mantine/core";
import ISO6391, {LanguageCode} from "iso-639-1";
import React, {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectLocale} from "../state/queries";
import {selectServerState} from "../state/server";
import {SelectObject} from "./Select";
import {useSideBar} from "./SideBar";
import { IconLanguage } from "@tabler/icons-react";

const localeSelectorStyle = (theme:MantineTheme) => ({
  input: {
    border: "none",
    background: theme.colors.blue[0],
    borderRadius: theme.radius.sm,
    color: theme.colors.blue[7],
    fontSize: 12,
    fontWeight: 700,
    width: 94,
    textTransform: "uppercase" as const,
  },
  item: {
    fontSize: 12,
    textTransform: "uppercase" as const
  },
  rightSection: {
      pointerEvents: "none",
  // weird hack, seems like CSSObject is not completely right defined inside mantine.
  } as CSSObject
})

type LocaleOptions = {label: string; value: LanguageCode};

/** */
export function SelectLocale() {
  const actions = useActions();
  const {resetGraph} = useSideBar();
  const {translate: t, locale} = useTranslation();

  const {code: currentCode} = useSelector(selectLocale);
  const {localeOptions} = useSelector(selectServerState);

  const theme = useMantineTheme();

  const options: LocaleOptions[] = useMemo(() => {
    const languages = ISO6391.getLanguages(localeOptions);
    return languages.map(lang => ({
      label:
        t("params.label_localeoption", {
          code: lang.code,
          engName: lang.name,
          nativeName: lang.nativeName,
          customName: t(`params.label_localecustom_${lang.code}`)
        }) || lang.nativeName,
      value: lang.code
    }));
  }, [locale, localeOptions]);

  const localeChangeHandler = useCallback((locale: LocaleOptions) => {
    resetGraph();
    actions.updateLocale(locale.value);
  }, []);

  if (localeOptions.length < 2) {
    return null;
  }

  console.log(options)
  return (
    <Box id="select-locale">
      <Tooltip label={t("params.label_locale")}>
        <SelectObject
          getLabel="value"
          getValue="value"
          items={options}
          onItemSelect={localeChangeHandler}
          selectedItem={currentCode}
          selectProps={{
            styles: localeSelectorStyle,
            icon: <IconLanguage size="0.8rem" color={theme.colors.blue[7]}/>
          }}
        />
      </Tooltip>
    </Box>
  );
}
