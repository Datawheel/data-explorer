import {Box, Button, Input} from "@mantine/core";
import React, {useMemo} from "react";
import {useSelector} from "react-redux";
import {useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem} from "../state/queries";
import {ButtonDownload} from "./ButtonDownload";
import {TesseractFormat} from "../api";

export const AreaDownloadQuery = () => {
  const {actions} = useSettings();

  const {translate: t} = useTranslation();

  const {isDirty, result} = useSelector(selectCurrentQueryItem);

  const buttons = useMemo(
    () =>
      Object.values(TesseractFormat).map(format => (
        <ButtonDownload
          key={format}
          provider={() => {
            actions.setLoadingState("FETCHING");
            return actions.willDownloadQuery(format).then(
              fileDescr => {
                actions.setLoadingState("SUCCESS");
                return fileDescr;
              },
              error => {
                actions.setLoadingState("FAILURE", error.message);
                throw error;
              },
            );
          }}
        >
          {t(`formats.${format}`)}
        </ButtonDownload>
      )),
    [t],
  );

  if (buttons.length === 0 || isDirty || result.data.length === 0) {
    return null;
  }

  return (
    <Box id="button-group-download-results">
      <Input.Wrapper label={t("params.title_downloaddata")}>
        <Button.Group>{buttons}</Button.Group>
      </Input.Wrapper>
    </Box>
  );
};
