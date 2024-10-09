import React from "react";
import {StepType, TourProps} from "@reactour/tour";

export interface ExplorerStepType extends StepType {
    actionBefore?: () => void;
}

export type TourConfig = {
    extraSteps?: ExplorerStepType[];
    introImage?: React.ReactNode;
    tourProps?: Partial<TourProps>;
}

export interface TourStepsPropsType {
    title: string;
    texts: string[] | string;
}