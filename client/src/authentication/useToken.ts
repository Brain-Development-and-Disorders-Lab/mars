import { useState } from "react";

// Existing and custom types
import { AuthInfo } from "@types";

// Utility functions and libraries
import { getToken } from "src/util";
import _ from "lodash";

// Variables
import { TOKEN_KEY } from "src/variables";

export const useToken = (): [AuthInfo, (token: AuthInfo) => void] => {
  const [token, setToken] = useState(getToken(TOKEN_KEY));

  const storeToken = (token: AuthInfo) => {
    if (_.isEqual(token, {})) {
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    }
    setToken(token);
  };

  return [token, storeToken];
};
