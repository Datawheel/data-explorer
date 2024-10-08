import React from "react";
import {Title, Text, Container} from "@mantine/core";
import { TourStepsPropsType } from "./types";

export default function TourStep(props: TourStepsPropsType) {
    const {title, texts} = props;
    const paragraphs = Array.isArray(texts) ? texts : [texts];
    return (
      <Container className="tour-item tour-step" pt="md">
        <div className="tour-text">
          <Title order={3}>{title}</Title>
          {paragraphs.map((p, i) => <Text component="p" key={`p-${i + 1}`}>{p}</Text>)}
        </div>
      </Container>
    );
  }