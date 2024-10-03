import { useState } from "react";

// Existing and custom types
import { IAuth } from "@types";

// Utility functions and libraries
import { getToken } from "src/util";
import _ from "lodash";

// Variables
import { TOKEN_KEY } from "src/variables";

export const useToken = (): [IAuth, (token: IAuth) => void] => {
  const [token, setToken] = useState(getToken(TOKEN_KEY));

  /**
   * Update the stored token data in the session storage
   * @param {IAuth} token Updated token data to store
   */
  const storeToken = (token: IAuth) => {
    if (_.isEqual(token, {})) {
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    }
    setToken(token);
  };

  return [token, storeToken];
};
