import React from "react";
import {TourProps, TourProvider} from "@reactour/tour";
import {Button, useMantineTheme} from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "../../hooks/translation";
import { useTourSteps } from "./useTourSteps";
import { TourConfig } from "./types";

function PrevButton(props) {
    const {translate: t} = useTranslation();
    const theme = useMantineTheme();
    const isRtl = theme.dir === "rtl";
    const handleClick = () => props.setCurrentStep(
        (s:number) => s === 0
            ?  props.steps.length - 1
            : s - 1
    )
    return (
        <Button            
            leftIcon={isRtl ? <IconArrowRight size="0.8rem" /> : <IconArrowLeft size="0.8rem" />}
            onClick={handleClick}
            radius={0}
            size="lg"
            sx={{flex: "0 0 50%"}}
            variant="light"
            disabled={props.currentStep === 0}
            w="50%"
        >
        {t("tour.controls.prev")}
        </Button>
    );
}


function NextButton(props) {
    const {translate: t} = useTranslation();
    const theme = useMantineTheme();
    const isRtl = theme.dir === "rtl";

    const handleClick = () => {
        if(props.currentStep === props.steps.length - 1) {
            props.setIsOpen(false);
            props.setCurrentStep(0);
        } else {
            const nextStep = props.steps[props.currentStep + 1];
            if (nextStep.hasOwnProperty("actionBefore")) {
                nextStep.actionBefore();
                setTimeout(() => props.setCurrentStep((s:number) => s + 1), 250);
            } else {
                props.setCurrentStep((s:number) => s + 1);
            }
        }
        
    }
    return (
        <Button
            variant="filled"
            w="50%"
            size="lg"
            sx={{flex: "0 0 50%"}}
            onClick={handleClick}
            rightIcon={isRtl ? <IconArrowLeft size="0.8rem" /> : <IconArrowRight size="0.8rem" />}
            radius={0}
        >
            {t("tour.controls.next")}
        </Button>
    );
}


const withBase = (styles: React.CSSProperties) => (base: React.CSSProperties) => ({...base, ...styles});

interface ExplorerTourProps {
    tourConfig: TourConfig;
};

const keyboardHandler = (rtl: Boolean) => (e, clickProps) => {
    e.stopPropagation();
    if(!clickProps) return;
    function next() {
        if(clickProps.currentStep === clickProps.steps.length - 1) {
            clickProps.setIsOpen(false);
            clickProps.setCurrentStep(0);
        } else {
            const nextStep = clickProps.steps[clickProps.currentStep + 1];
            if (nextStep.hasOwnProperty("actionBefore")) {
                nextStep.actionBefore();
                setTimeout(() => clickProps.setCurrentStep((s:number) => s + 1), 250);
            } else {
                clickProps.setCurrentStep((s:number) => s + 1);
            }
        }
    }
  
    function prev() {
        clickProps.setCurrentStep(
            (s:number) => s === 0
                ?  clickProps.steps.length - 1
                : s - 1
        )
    }

    if (e.keyCode === 27) {
        e.preventDefault()
        clickProps.setIsOpen(false)
      }
      if (e.keyCode === 39) {
        e.preventDefault()
        if (rtl) {
          prev()
        } else {
          next()
        }
      }
      if (e.keyCode === 37) {
        e.preventDefault()
        if (rtl) {
          next()
        } else {
          prev()
        }
      }
}
export default function ExplorerTour({children, tourConfig}: React.PropsWithChildren<ExplorerTourProps>) {
    const theme = useMantineTheme();
    const steps = useTourSteps(tourConfig);
    const styles = {
        popover: withBase({padding: 0, borderRadius: theme.radius.md, overflow: "hidden"}),
        controls: withBase({flexWrap: "wrap"}),
        navigation: withBase({
            justifyContent:"center",
            order: -1,
            width: "100%",
            margin: `0 auto ${theme.spacing.xs}`,
        }),
        dot: (base: React.CSSProperties, {current}) => ({
            ...base,
            background: current ? theme.fn.primaryColor(): "transparent",
            color: theme.fn.primaryColor(),
            borderColor: theme.colors.gray[5]
        })
    };

    const rtl = theme.dir === "rtl";

    return (
        <TourProvider
            steps={steps}
            position="right"
            prevButton={PrevButton}
            nextButton={NextButton}
            showBadge={false}
            styles={styles}
            rtl={theme.dir === "rtl"}
            keyboardHandler={keyboardHandler(rtl)}
            disableInteraction
            {...tourConfig?.tourProps}
        >
            {children}
        </TourProvider>
    )
}