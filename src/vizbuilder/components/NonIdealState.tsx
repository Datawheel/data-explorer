import {Center, Flex, Loader, Text, Title} from "@mantine/core";
import {IconCircleOff} from "@tabler/icons-react";
import React, {useMemo} from "react";
import {useTranslation} from "../../hooks/translation";

export function NonIdealState(props: {
  status: "loading" | "empty";
}) {
  const {status} = props;

  const {translate: t} = useTranslation();

  const description = useMemo(() => {
    if (status === "loading") {
      return (
        <Flex justify="center" align="center" direction="column">
          <Loader size="xl" />
          <Title mt="md" order={4}>
            {t("vizbuilder.transient.title_loading")}
          </Title>
        </Flex>
      );
    }
    return (
      <Flex justify="center" align="center" direction="column" w="50%">
        <IconCircleOff size={92} />
        <Title mt="md" mb="md" order={4}>
          {t("vizbuilder.transient.title_empty")}
        </Title>
        <Text>{t("vizbuilder.transient.description_empty")}</Text>
      </Flex>
    );
  }, [status, t]);

  return <Center h="40vh">{description}</Center>;
}
