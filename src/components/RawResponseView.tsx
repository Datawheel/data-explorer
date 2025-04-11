import React from "react";
import {
  Button,
  Container,
  CopyButton,
  Group,
  Stack,
  TextInput,
  useMantineTheme
} from "@mantine/core";
import {
  IconClipboard,
  IconClipboardCheck,
  IconExternalLink,
  IconWorldWww
} from "@tabler/icons-react";

export function RawResponseView(props) {
  const {result, isLoading, isFetching} = props;
  //   const [user] = useUser();
  //   const {t} = useTranslation("explorer");

  console.log(result);

  const theme = useMantineTheme();
  const token = "tokenValue";

  const tokenizedUrl = result?.url ? `${result.url}${token ? `&token=${token}` : ""}` : "";
  const curlCommand = `curl "${tokenizedUrl}"`;

  return (
    <Container fluid py="xl">
      <Stack>
        <Group align="flex-end" noWrap w="100%">
          <TextInput
            icon={<IconWorldWww size={20} />}
            label={"API URL"}
            readOnly
            value={tokenizedUrl}
            w="100%"
            mb={0}
            disabled={isLoading || isFetching}
          />
          <Button.Group>
            <Button
              component="a"
              href={tokenizedUrl}
              target="_blank"
              leftIcon={<IconExternalLink />}
              sx={{
                borderBottomRightRadius: 0,
                borderTopRightRadius: 0
              }}
            >
              {"Open"}
            </Button>
            <CopyButton value={tokenizedUrl}>
              {({copied, copy}) => (
                <Button
                  color={copied ? theme.colors.teal[5] : theme.colors.green[7]}
                  leftIcon={copied ? <IconClipboardCheck /> : <IconClipboard />}
                  onClick={copy}
                  sx={theme => ({
                    borderBottomLeftRadius: 0,
                    borderTopLeftRadius: 0,
                    "&:hover": {
                      background: theme.colors.green[7]
                    }
                  })}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CopyButton>
          </Button.Group>
        </Group>
        <Group align="flex-end" noWrap w="100%">
          <TextInput
            icon={<IconWorldWww size={20} />}
            label={"Curl Command"}
            readOnly
            value={curlCommand}
            w="100%"
            mb={0}
            disabled={isLoading || isFetching}
          />
          <CopyButton value={curlCommand}>
            {({copied, copy}) => (
              <Button
                color={copied ? theme.colors.teal[5] : theme.colors.green[7]}
                leftIcon={copied ? <IconClipboardCheck /> : <IconClipboard />}
                onClick={copy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </Container>
  );
}
