import React from "react";
import {TourProvider, useTour} from "@reactour/tour";
import {Affix, Button, useMantineTheme} from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "../../hooks/translation";
import { useTourSteps } from "./useTourSteps";

function PrevButton(props) {
    const {translate: t} = useTranslation();
    const handleClick = () => props.setCurrentStep(
        (s:number) => s === 0
            ?  props.steps.length - 1
            : s - 1
    )
    return (
        <Button            
            leftIcon={<IconArrowLeft size="0.8rem" />}
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
    const handleClick = () => {
        if(props.currentStep === props.steps.length - 1) {
            props.setIsOpen(false);
            props.setCurrentStep(0);
        } else {
            props.setCurrentStep((s:number) => s + 1);
        }
        
    }
    return (
        <Button
            variant="filled"
            w="50%"
            size="lg"
            sx={{flex: "0 0 50%"}}
            onClick={handleClick}
            rightIcon={<IconArrowRight size="0.8rem" />}
            radius={0}
        >
            {t("tour.controls.next")}
        </Button>
    );
}

const TourPanel = () => {
    const tour = useTour();
    return (
        <Affix top={0} right={0}>
            <Button onClick={() => tour.setIsOpen(true)}>Start Tour</Button>
        </Affix>
    )
}

const withBase = (styles: React.CSSProperties) => (base: React.CSSProperties) => ({...base, ...styles});

export default function ExplorerTour({children}) {
    const theme = useMantineTheme();
    const {translations} = useTranslation();
    const steps = useTourSteps();
    const styles = {
        popover: withBase({padding: 0, borderRadius: theme.radius.md, overflow: "hidden"}),
        controls: withBase({flexWrap: "wrap"}),
        navigation: withBase({
            justifyContent:"center",
            order: -1,
            width: "100%",
            margin: `0 auto ${theme.spacing.xs}`,
        })
    };

    return (
        <TourProvider
            steps={steps}
            position="right"
            prevButton={PrevButton}
            nextButton={NextButton}
            showBadge={false}
            styles={styles}
            disableInteraction
        >
            {children}
            <TourPanel />
        </TourProvider>
    )
}