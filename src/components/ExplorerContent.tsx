import {useState} from "react";
import {ServerConfig} from "@datawheel/olap-client";
import {TranslationContextProps} from "@datawheel/use-translation";
import {
  CSSObject,
  Center,
  createStyles,
  Header,
  useMantineTheme
} from "@mantine/core";
import React, {useEffect, useMemo} from "react";
import {useSelector} from "react-redux";
import {useSetup} from "../hooks/setup";
import {useTranslation} from "../hooks/translation";
import {selectServerState} from "../state/server";
import {PanelDescriptor} from "../utils/types";
import {AnimatedCube} from "./AnimatedCube";
import {ExplorerResults} from "./ExplorerResults";
import SideBar, {SideBarProvider, SideBarItem} from "./SideBar";
import ParamsExplorer from "./ParamsExplorer";
import {HomeSVG} from "./icons";

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
    height: "calc(100% - 50px)",
    [theme.fn.largerThan("md")]: {
      flexDirection: "row"
      // height: params.height,
      // width: "100%"
    }
  },

  flexCol: {
    flex: "1 1 auto",
    height: "calc(100vh - 50px)",
    [theme.fn.largerThan("md")]: {
      width: 0
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
}) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const translation = useTranslation();

  const isSetupDone = useSetup(props.source, props.dataLocale);
  const serverState = useSelector(selectServerState);

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
      <Header height={{base: 50}} p="md">
        <div style={{display: "flex", alignItems: "center", height: "100%", padding: 5}}>
          <HomeSVG />
        </div>
      </Header>
      <div className={classes.root}>
        <SideBarProvider>
          <SideBar>
            <SideBarItem>
              <ParamsExplorer />
            </SideBarItem>
            <SideBarItem />
          </SideBar>
        </SideBarProvider>
        {/* <LoadingOverlay /> */}
        <ExplorerResults className={classes.flexCol} panels={props.panels} splash={splash} />
      </div>
    </div>
  );

  // return (
  //   <div className={classes.root}>

  //     <LoadingOverlay />
  //     {isSetupDone && serverState.online && props.withMultiQuery
  //       ? <ExplorerQueries />
  //       : null
  //     }
  //     {isSetupDone && serverState.online
  //       ? <ExplorerParams defaultOpen={props.defaultOpenParams} />
  //       : null
  //     }
  //     <ExplorerResults
  //       className={classes.flexCol}
  //       panels={props.panels}
  //       splash={splash}
  //     />
  //   </div>
  // );
}
