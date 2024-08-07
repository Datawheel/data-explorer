import {Box} from "@mantine/core";
import ISO6391, {LanguageCode} from "iso-639-1";
import React, {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectLocale} from "../state/queries";
import {selectServerState} from "../state/server";
import {SelectObject} from "./Select";
import {useSideBar} from "./SideBar";

type LocaleOptions = {label: string; value: LanguageCode};

/** */
export function SelectLocale() {
  const actions = useActions();
  const {resetGraph} = useSideBar();
  const {translate: t, locale} = useTranslation();

  const {code: currentCode} = useSelector(selectLocale);
  const {localeOptions} = useSelector(selectServerState);

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

  const localeChangeHandler = (l: LocaleOptions) => {
    if (currentCode !== l.value) {
      resetGraph();
      actions.updateLocale(l.value);
    }
  };

  if (localeOptions.length < 2) {
    return null;
  }

  return (
    <Box id="select-locale">
      <SelectObject
        label={t("params.label_locale")}
        getLabel="label"
        getValue="value"
        items={options}
        onItemSelect={localeChangeHandler}
        selectedItem={currentCode}
      />
    </Box>
  );
}
