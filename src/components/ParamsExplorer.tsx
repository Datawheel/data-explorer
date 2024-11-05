import React from "react";
import {SelectCube} from "./SelectCubes";

type Props = {
  locale: string
};

function ParamsExplorer(props: Props) {
  const {locale} = props;
  return (
      <SelectCube locale={locale}/>
  );
}

export default ParamsExplorer;
