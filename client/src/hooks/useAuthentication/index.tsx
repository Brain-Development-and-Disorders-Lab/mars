import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Token management
import { useToken } from "src/hooks/useToken";

// Custom types
import { IAuth, IResponseMessage, ResponseData, UserModel } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Utility functions and libraries
import _ from "lodash";

type AuthenticationContextValue = {
  token: IAuth;
  setToken: (token: IAuth) => void;
  isAuthenticated: boolean;
  login: (code: string) => Promise<IResponseMessage>;
  logout: () => void;
};
const AuthenticationContext = createContext({} as AuthenticationContextValue);

export const AuthenticationProvider = (props: {
  children: React.JSX.Element;
}) => {
  const navigate = useNavigate();

  // Setup token authentication
  const [token, setToken] = useToken();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(token.token !== "");

  // Access parameters to remove code after authentication
  const [searchParams, setSearchParams] = useSearchParams();

  // Remove the "code" search parameter upon login
  const removeCode = () => {
    if (searchParams.has("code")) {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
  };

  // Queries
  const LOGIN_DATA = gql`
    query PerformLogin($code: String) {
      login(code: $code) {
        success
        message
        data {
          orcid
          name
          token
        }
      }
    }
  `;
  const [doLogin] = useLazyQuery<{
    login: ResponseData<IAuth>;
  }>(LOGIN_DATA);

  // Query to retrieve User
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        affiliation
      }
    }
  `;
  const [getUser, { error: userError }] = useLazyQuery<{ user: UserModel }>(
    GET_USER,
  );

  const logout = () => {
    // Reset the authentication state
    setIsAuthenticated(false);

    // Invalidate the token
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
    });

    // Navigate to the login page
    navigate("/login");
  };

  /**
   * Utility function to perform a Login operation
   * @param code String returned by ORCID API for login
   */
  const login = async (code: string): Promise<IResponseMessage> => {
    // Query to retrieve Entity data and associated data for editing
    const loginResponse = await doLogin({ variables: { code: code } });
    const loginData = loginResponse.data?.login;

    if (_.isUndefined(loginData) || loginData.success === false) {
      setIsAuthenticated(false);
      return {
        success: false,
        message: "Unable to log in, check network connection",
      };
    }

    const userResponse = await getUser({
      variables: {
        _id: loginData.data.orcid,
      },
    });
    const userData = userResponse.data?.user;
    if (!_.isUndefined(userError)) {
      setIsAuthenticated(false);
      return {
        success: false,
        message: "Unable to retrieve User information",
      };
    } else if (_.isUndefined(userData)) {
      setIsAuthenticated(false);
      return {
        success: false,
        message: "User does not have access",
      };
    }

    // Update the User and authentication state
    setIsAuthenticated(true);

    // Perform login and data retrieval via server, check if user permitted access
    removeCode();

    // Create a new token instance
    setToken(loginData.data);

    return {
      success: true,
      message: "Logged in successfully",
    };
  };

  const value = useMemo(
    () => ({
      isAuthenticated: isAuthenticated,
      token,
      setToken,
      login,
      logout,
    }),
    [token],
  );

  return (
    <AuthenticationContext.Provider value={value}>
      {props.children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => {
  return useContext(AuthenticationContext);
};
