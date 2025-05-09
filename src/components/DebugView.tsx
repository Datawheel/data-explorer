import {Box, Button, Group, Input, SimpleGrid, Stack, Text} from "@mantine/core";
import {useClipboard} from "@mantine/hooks";
import {IconClipboard, IconExternalLink, IconWorld} from "@tabler/icons-react";
import React, {useCallback, useMemo} from "react";
import {useTranslation} from "../hooks/translation";
import type {ViewProps} from "../utils/types";

/** */
export function DebugView(props: ViewProps) {
  if (!props.result) return null;

  const {url} = props.result;

  const {translate: t} = useTranslation();

  const {copy, copied} = useClipboard({timeout: 1000});

  const copyHandler = useCallback(() => copy(url), [url, copy]);

  const openHandler = useCallback(() => window.open(url, "_blank"), [url]);

  const headers = useMemo(() => {
    const headers = Object.entries(props.result?.headers || {});
    if (headers.length === 0) return null;

    return (
      <Input.Wrapper label={t("debug_view.httpheaders")}>
        <Box component="dl" sx={{fontFamily: "monospace", overflowWrap: "break-word"}}>
          {headers.map(entry => (
            <React.Fragment key={entry[0]}>
              <Text component="dt" fw="bold" fz="sm">
                {entry[0]}
              </Text>
              <Text component="dd" c="#5c940d" fz="sm">
                {entry[1]}
              </Text>
            </React.Fragment>
          ))}
        </Box>
      </Input.Wrapper>
    );
  }, [props.result.headers, t]);

  return (
    <Box id="query-results-debug-view">
      <Stack spacing="md" px="md" py="sm">
        {url && (
          <Input.Wrapper label={t("debug_view.url_logiclayer")}>
            <Group noWrap spacing="xs">
              <Input icon={<IconWorld />} readOnly rightSectionWidth="auto" value={url} w="100%" />
              <Button.Group>
                <Button leftIcon={<IconExternalLink />} onClick={openHandler} variant="default">
                  {t("action_open")}
                </Button>
                <Button leftIcon={<IconClipboard />} onClick={copyHandler} variant="default">
                  {copied ? t("action_copy_done") : t("action_copy")}
                </Button>
              </Button.Group>
            </Group>
          </Input.Wrapper>
        )}

        <SimpleGrid cols={2}>{headers}</SimpleGrid>
      </Stack>
    </Box>
  );
}
