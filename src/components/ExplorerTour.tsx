import React from "react";
import {TourProvider, useTour, components} from "@reactour/tour";
import {Affix, Box, Button, Container, Flex, Group, Image, Stack, useMantineTheme} from "@mantine/core";
import { useSelector } from "../state";
import { selectLocale } from "../state/queries";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "../hooks/translation";

function FirstStep() {
    const {translate: t} = useTranslation();
    return (
      <Container className="tour-item tour-welcome">
        <div className="tour-img">
          <Image src="/images/tour/tour-start.png" width={237} height={136} alt="Tour Intro Image" />
        </div>
        <div className="tour-text">
          <h3>{t("tour.steps.welcome.title")}</h3>
          <p>{t("tour.steps.welcome.text1")}</p>
          <p>{t("tour.steps.welcome.text2")}</p>
        </div>
      </Container>
    );
  }

const createSteps = t => [
    {
        selector: "document",
        content: <FirstStep />,
        position: "center",
    },
    {
      selector: '#dex-select-locale',
      content: 'This is my first Step',
    },
    {
      selector: '#dex-search',
      content: 'This is my first Step',
    },
    // ...
  ]

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
            steps={createSteps(key => translations(`steps.${key}`))}
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