import type {TranslationContextProps} from "@datawheel/use-translation";
import {type CSSObject, Center, createStyles} from "@mantine/core";
import React, {useMemo} from "react";
import {useTranslation} from "../hooks/translation";
import type {PanelDescriptor} from "../utils/types";
import {AnimatedCube} from "./AnimatedCube";
import {ExplorerResults} from "./ExplorerResults";
import SideBar, {SideBarItem, SideBarProvider} from "./SideBar";
import {SelectCubes} from "./SelectCubes";
import {useSettings} from "../hooks/settings";

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
    height: "100%",
    [theme.fn.largerThan("md")]: {
      flexDirection: "row"
    }
  },
  flexCol: {
    flex: "1 1 auto",
    height: "100%",
    [theme.fn.largerThan("md")]: {
      width: 0,
      paddingLeft: 0
    }
  }
}));

export function ExplorerContent(props: {
  defaultCube?: string;
  defaultOpenParams: string;
  height: CSSObject["height"];

  panels: PanelDescriptor[];
  serverConfig?: RequestInit;
  serverURL: string;
  splash?: React.ComponentType<{translation: TranslationContextProps}>;
  withMultiQuery: boolean;
}) {
  const {classes} = useStyles({height: props.height});
  const {defaultLocale} = useSettings();
  const translation = useTranslation();

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
        <SideBarProvider locale={defaultLocale}>
          <SideBar>
            <SideBarItem>
              <SelectCubes locale={defaultLocale} />
            </SideBarItem>
          </SideBar>
        </SideBarProvider>
        <ExplorerResults
          className={classes.flexCol}
          panels={props.panels}
          splash={splash}
          serverURL={props.serverURL}
        />
      </div>
    </div>
  );
}

// const serverConfig = useMemo(() => {
//   return props.serverConfig !== undefined ? props.serverConfig : {};
// }, [props.serverConfig]);
// useSetup(props.serverURL, serverConfig, props.defaultDataLocale, props.defaultCube);
