import { useState } from "react";

// Existing and custom types
import { ISession } from "@types";

// Utility functions and libraries
import { getSession } from "@lib/util";
import _ from "lodash";

// Variables
import { SESSION_KEY } from "src/variables";

export const useSession = (): [ISession, (session: ISession) => void] => {
  const [session, setSession] = useState(getSession(SESSION_KEY));

  /**
   * Update the stored token data in the session storage
   * @param {ISession} session Updated token data to store
   */
  const storeSession = (session: ISession) => {
    if (_.isEqual(session, {})) {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    setSession(session);
  };

  return [session, storeSession];
};
