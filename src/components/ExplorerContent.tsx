import type {TranslationContextProps} from "@datawheel/use-translation";
import {type CSSObject, Center, createStyles} from "@mantine/core";
import React, {useEffect, useMemo} from "react";
import {AppProviders} from "../context";
import {useSetup} from "../hooks/setup";
import {useTranslation} from "../hooks/translation";
import type {PanelDescriptor} from "../utils/types";
import {AnimatedCube} from "./AnimatedCube";
import {ExplorerResults} from "./ExplorerResults";
import ParamsExplorer from "./ParamsExplorer";
import SideBar, {SideBarItem, SideBarProvider} from "./SideBar";

const useStyles = createStyles((theme, params: {height: CSSObject["height"]}) => ({
  container: {
    height: "100%",
    [theme.fn.largerThan("md")]: {
      height: params.height,
      width: "100%",
    },
  },
  root: {
    display: "flex",
    flexFlow: "column nowrap",
    position: "relative",
    height: "100%",
    [theme.fn.largerThan("md")]: {
      flexDirection: "row",
      // height: params.height,
      // width: "100%"
    },
  },
  flexCol: {
    flex: "1 1 auto",
    height: "100%",
    [theme.fn.largerThan("md")]: {
      width: 0,
      paddingLeft: 0,
    },
  },
}));

/** */
export function ExplorerContent(props: {
  defaultCube?: string;
  defaultDataLocale?: string;
  defaultOpenParams: string;
  height: CSSObject["height"];
  locale: string;
  panels: PanelDescriptor[];
  serverConfig?: RequestInit;
  serverURL: string;
  splash?: React.ComponentType<{translation: TranslationContextProps}>;
  withMultiQuery: boolean;
}) {
  const translation = useTranslation();

  const serverConfig = useMemo(() => {
    return props.serverConfig !== undefined ? props.serverConfig : {};
  }, [props.serverConfig]);


  useSetup(
    props.serverURL,
    serverConfig,
    props.defaultDataLocale,
    props.defaultCube,
  );

  const {classes} = useStyles({height: props.height});

  // Monitor the uiLocale param to update the UI on change
  useEffect(() => {
    if (props.locale) translation.setLocale(props.locale);
  }, [props.locale, translation]);

  const splash = useMemo(() => {
    const SplashComponent = props.splash;
    return SplashComponent ? (
      <SplashComponent translation={translation} />
    ) : (
      <Center h="100%" sx={{flex: 1}}>
        <AnimatedCube />
      </Center>
    );
  }, [props.splash, translation]);

  return (
    <div className={classes.container}>
      <div className={classes.root}>
        <AppProviders>
          <SideBarProvider locale={props.locale}>
            <SideBar>
              <SideBarItem>
                <ParamsExplorer locale={props.locale} />
              </SideBarItem>
            </SideBar>
          </SideBarProvider>
          <ExplorerResults
            className={classes.flexCol}
            panels={props.panels}
            splash={splash}
          />
        </AppProviders>
      </div>
    </div>
  );
}
