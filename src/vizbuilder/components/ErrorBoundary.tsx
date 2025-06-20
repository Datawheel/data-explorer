import {Button, Flex, Group, Text, Title} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";
import React, {Component} from "react";
import {TranslationConsumer, useVizbuilderTranslation} from "../../hooks/translation";

interface Props {
  children: React.ReactNode;
}

interface State {
  message: string;
  name: string;
}

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return {message: error.message, name: error.name};
  }

  state: State = {
    message: "",
    name: "",
  };

  clearError = () => this.setState({message: "", name: ""});

  render() {
    const {message, name} = this.state;

    if (!message) {
      return this.props.children;
    }

    return (
      <TranslationConsumer>
        {({translate: t}) => {
          const detailText = t("vizbuilder.error.detail");

          return (
            <Flex
              p="xl"
              align="center"
              justify="center"
              direction="column"
              className="chart-card error"
            >
              <Title order={3}>{t("vizbuilder.error.title")}</Title>
              {detailText.length ? <Text>{detailText}</Text> : null}
              <Text>{t("vizbuilder.error.message", {message})}</Text>
              <Group spacing="xs" my="sm">
                <Button onClick={this.clearError} size="xs" variant="light">
                  {t("vizbuilder.action_retry")}
                </Button>
                <IssueButton error={name} message={message} />
              </Group>
            </Flex>
          );
        }}
      </TranslationConsumer>
    );
  }
}

function IssueButton(props: {error: string; message?: string}) {
  const {error, message} = props;

  const {t} = useVizbuilderTranslation();
  const location = typeof window === "object" ? window.location : {href: "<SSR>"};

  const issueParams = new URLSearchParams({
    title: `[report/vizbuilder] ${error}`,
    body: [
      `**URL**: ${location.href}`,
      `**Error**: ${error}`,
      message ? `**Error details:** ${message}\n` : "",
      "**Detail of the issue:**\n",
    ].join("\n"),
  });

  return (
    <Button
      component="a"
      href={`https://github.com/Datawheel/vizbuilder/issues/new?${issueParams}`}
      leftIcon={<IconBrandGithub size="1rem" />}
      rel="noopener noreferrer"
      role="button"
      size="xs"
      tabIndex={0}
      target="_blank"
      variant="subtle"
    >
      {t("action_fileissue")}
    </Button>
  );
}
