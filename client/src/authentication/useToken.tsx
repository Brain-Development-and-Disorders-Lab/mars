import { useState } from "react";

// Existing and custom types
import { AuthToken } from "@types";

// Utility functions and libraries
import _ from "lodash";

const TOKEN_KEY = "MARS_token";

export const useToken = (): [AuthToken, (token: AuthToken) => void] => {
  const getToken = () => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    if (!_.isNull(storedToken) && !_.isUndefined(storedToken)) {
      return JSON.parse(storedToken);
    }
    return undefined;
  };

  const [token, setToken] = useState(getToken());

  const storeToken = (token: AuthToken) => {
    if (token.valid === false) {
      // Equivalent of logout operation
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    }
    setToken(token);
  };

  return [token, storeToken];
};
