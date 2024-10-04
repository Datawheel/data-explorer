import React from "react";
import { Container } from "@mantine/core";
import { useTranslation } from "../../hooks/translation";

export default function FirstStep() {
    const {translate: t} = useTranslation();
    return (
      <Container className="tour-item tour-welcome">
        {/* <div className="tour-img">
          <Image src="/images/tour/tour-start.png" width={237} height={136} alt="Tour Intro Image" />
        </div> */}
        <div className="tour-text">
          <h3>{t("tour.steps.welcome.title")}</h3>
          <p>{t("tour.steps.welcome.text1")}</p>
          <p>{t("tour.steps.welcome.text2")}</p>
        </div>
      </Container>
    );
  }