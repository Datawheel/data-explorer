import React from "react";
import { Box, Container } from "@mantine/core";
import { useTranslation } from "../../hooks/translation";

interface FirstStepProps {
  introImage?: React.ReactNode;
}
export default function FirstStep({introImage}:FirstStepProps) {
    const {translate: t} = useTranslation();
    return (
      <Container className="tour-item tour-welcome" px={0}>
        {introImage && 
          <div className="tour-img">
            {introImage}
          </div>
        }
        <Box className="tour-text" px="md">
          <h3>{t("tour.steps.welcome.title")}</h3>
          <p>{t("tour.steps.welcome.text1")}</p>
          <p>{t("tour.steps.welcome.text2")}</p>
        </Box>
      </Container>
    );
  }