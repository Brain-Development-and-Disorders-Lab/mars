import { useContext, useEffect, useState } from "react";

// Existing and custom types
import { IAuth } from "@types";

// Utility functions and libraries
import { getToken } from "src/util";
import _ from "lodash";

// Variables
import { TOKEN_KEY } from "src/variables";

// Workspace context
import { WorkspaceContext } from "src/Context";

export const useToken = (): [IAuth, (token: IAuth) => void] => {
  const [token, setToken] = useState(getToken(TOKEN_KEY));

  /**
   * Note: Effect to update the Workspace value stored in the token as it is updated by the UI.
   * Critical to synchronise the UI and token Workspaces, since all GraphQL requests use the value stored
   * in the token.
   */
  const { workspace } = useContext(WorkspaceContext);
  useEffect(() => {
    const updatedToken = _.cloneDeep(token);
    updatedToken.workspace = workspace;
    storeToken(updatedToken);
  }, [workspace]);

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
