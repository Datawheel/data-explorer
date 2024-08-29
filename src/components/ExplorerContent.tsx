import React, {useState, useEffect, useMemo} from "react";
import {ServerConfig} from "@datawheel/olap-client";
import {TranslationContextProps} from "@datawheel/use-translation";
import {CSSObject, Center, createStyles, Header, useMantineTheme} from "@mantine/core";
import {useSetup} from "../hooks/setup";
import {useTranslation} from "../hooks/translation";
import {PanelDescriptor} from "../utils/types";
import {AnimatedCube} from "./AnimatedCube";
import {ExplorerResults} from "./ExplorerResults";
import SideBar, {SideBarProvider, SideBarItem} from "./SideBar";
import ParamsExplorer from "./ParamsExplorer";
import {HomeSVG} from "./icons";
import {AppProviders} from "../context";
const useStyles = createStyles((theme, params: {height: CSSObject["height"]}) => ({
  container: {
    height: "100%",
    [theme.fn.largerThan("md")]: {
      height: params.height,
      width: "100%"
    }
  },
  root: {
    display: "flex",
    flexFlow: "column nowrap",
    position: "relative",
    height: "calc(100% - 70px)",
    [theme.fn.largerThan("md")]: {
      flexDirection: "row"
      // height: params.height,
      // width: "100%"
    }
  },
  flexCol: {
    flex: "1 1 auto",
    height: "calc(100vh - 70px)",
    [theme.fn.largerThan("md")]: {
      width: 0,
      paddingLeft: 0
    }
  }
}));

/** */
export function ExplorerContent(props: {
  dataLocale: string[];
  defaultOpenParams: string;
  height: CSSObject["height"];
  panels: PanelDescriptor[];
  source: ServerConfig;
  splash?: React.ComponentType<{translation: TranslationContextProps}>;
  uiLocale: string | undefined;
  withMultiQuery: boolean;
  defaultCube?: string;
}) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const translation = useTranslation();

  useSetup(props.source, props.dataLocale, props.defaultCube);

  const {classes} = useStyles({height: props.height});

  // Monitor the uiLocale param to update the UI on change
  useEffect(() => {
    if (props.uiLocale) translation.setLocale(props.uiLocale);
  }, [props.uiLocale]);

  const splash = useMemo(() => {
    const SplashComponent = props.splash;
    return SplashComponent ? (
      <SplashComponent translation={translation} />
    ) : (
      <Center h="100%" sx={{flex: 1}}>
        <AnimatedCube />
      </Center>
    );
  }, [props.splash]);

  return (
    <div className={classes.container}>
      <div className={classes.root}>
        <AppProviders>
          <SideBarProvider>
            <SideBar>
              <SideBarItem>
                <ParamsExplorer />
              </SideBarItem>
            </SideBar>
          </SideBarProvider>
          <ExplorerResults className={classes.flexCol} panels={props.panels} splash={splash} />
        </AppProviders>
      </div>
    </div>
  );
}
