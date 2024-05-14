import React from "react";
import {Box} from "@mantine/core";

import {SelectLocale} from "./SelectLocale";
import {SelectCube} from "./SelectCubes";

type Props = {};

function ParamsExplorer(props: Props) {
  const {} = props;

  return (
    <Box>
      <SelectLocale />
      <SelectCube />
    </Box>
  );
}

export default ParamsExplorer;
