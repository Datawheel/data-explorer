import React from "react";
import { Title, Text, Container } from "@mantine/core";

export default function LastStep({t}) {
    return (
      <Container className="tour-item tour-last" pt="md">
        <div className="tour-text">
          <Title order={3}>{t("tour.steps.last.title")}</Title>
          <Text component="p">{t("tour.steps.last.text")}</Text>
        </div>
      </Container>
    );
  }