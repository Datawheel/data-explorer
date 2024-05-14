import React from "react";

export const createContext = <T extends {}>(name) => {
  const Context = React.createContext<T | undefined>(undefined);

  const useContext = () => {
    const ctx = React.useContext(Context);

    if (ctx === undefined) {
      throw new Error(`useContext for must be inside a ${name}Provider with a value`);
    }

    return ctx;
  };

  return [useContext, Context.Provider] as const;
};
