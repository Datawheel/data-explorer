import {Box, MantineTheme, CSSObject, Tooltip, useMantineTheme} from "@mantine/core";
import ISO6391, {LanguageCode} from "iso-639-1";
import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem, selectCurrentQueryParams} from "../state/queries";
import {SelectObject} from "./Select";
import {IconLanguage} from "@tabler/icons-react";
import {useServerSchema} from "../hooks/useQueryApi";
import {useActions} from "../hooks/settings";
import {useUpdateUrl} from "../hooks/permalink";

const localeSelectorStyle = (theme: MantineTheme) => ({
  input: {
    border: "none",
    background:
      theme.colorScheme === "dark"
        ? theme.fn.darken(theme.fn.primaryColor(), 0.1)
        : theme.fn.lighten(theme.fn.primaryColor(), 0.8),
    borderRadius: theme.radius.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.fn.lighten(theme.fn.primaryColor(), 0.7)
        : theme.fn.primaryColor(),
    fontSize: 12,
    fontWeight: 700,
    width: 94,
    textTransform: "uppercase" as const
  },
  item: {
    fontSize: 12,
    textTransform: "uppercase" as const
  },
  rightSection: {
    pointerEvents: "none"
    // weird hack, seems like CSSObject is not completely right defined inside mantine.
  } as CSSObject
});

type LocaleOptions = {label: string; value: LanguageCode};

const getCurrentLocale = (params, server) => {
  const code = params.locale || server.localeOptions[0] || "";
  return {
    code,
    name: ISO6391.getName(code),
    nativeName: ISO6391.getNativeName(code)
  };
};

export function LocaleSelector() {
  const updateUrl = useUpdateUrl();
  const actions = useActions();
  const {translate: t, locale, setLocale} = useTranslation();
  const {data: schema} = useServerSchema();
  const localeOptions = schema?.localeOptions || [];
  const theme = useMantineTheme();
  const params = useSelector(selectCurrentQueryParams);
  const queryItem = useSelector(selectCurrentQueryItem);

  const {code: currentCode} = getCurrentLocale(params, schema);

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

  const localeChangeHandler = async (l: LocaleOptions) => {
    actions.updateLocale(l.value);
    updateUrl({...queryItem, params: {...queryItem.params, locale: l.value}});
    setLocale(l.value);
  };

  if (localeOptions.length < 2) {
    return null;
  }

  return (
    <Box id="dex-select-locale">
      <Tooltip label={t("params.label_locale")}>
        <SelectObject
          getLabel="value"
          getValue="value"
          items={options}
          onItemSelect={localeChangeHandler}
          selectedItem={currentCode}
          selectProps={{
            styles: localeSelectorStyle,
            icon: (
              <IconLanguage
                size="0.8rem"
                color={
                  theme.colorScheme === "dark"
                    ? theme.fn.lighten(theme.fn.primaryColor(), 0.8)
                    : theme.fn.primaryColor()
                }
              />
            )
          }}
        />
      </Tooltip>
    </Box>
  );
}
