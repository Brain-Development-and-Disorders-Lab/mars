import { AuthenticationStruct } from "@types";
import React, { createContext, useContext, useState } from "react";

const authenticationContext = createContext<AuthenticationStruct | undefined>(undefined);

const useAuthentication = (): AuthenticationStruct => {
  const [authenticated, setAuthenticated] = useState(false);

  return {
    authenticated,
    login (): Promise<void> {
      return new Promise((resolve) => {
        setAuthenticated(true);
        resolve();
      });
    },
    logout (): Promise<void> {
      return new Promise((resolve) => {
        setAuthenticated(false);
        resolve();
      });
    },
  };
};

export const AuthenticationProvider: React.FC<any> = ({ children }) => {
  const authentication = useAuthentication();

  return (
    <authenticationContext.Provider value={authentication}>
      {children}
    </authenticationContext.Provider>
  );
};

export const AuthenticationConsumer = () => {
  return useContext(authenticationContext);
};
