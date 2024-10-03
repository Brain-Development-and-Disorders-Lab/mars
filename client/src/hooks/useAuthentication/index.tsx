import React, { createContext, useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToken } from "../../authentication/useToken";
import { IAuth, ResponseData, UserModel } from "@types";
import { gql, useLazyQuery } from "@apollo/client";
import _ from "lodash";

type AuthenticationContextValue = {
  token: IAuth;
  setToken: (token: IAuth) => void;
  isAuthenticated: boolean;
  login: (code: string) => Promise<ResponseData<UserModel>>;
  logout: () => void;
};
const AuthenticationContext = createContext({} as AuthenticationContextValue);

export const AuthenticationProvider = (props: {
  children: React.JSX.Element;
}) => {
  // Setup token authentication
  const [token, setToken] = useToken();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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
    // Invalidate the token and refresh the page
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
      workspace: "",
    });
    navigate("/login");
  };

  /**
   * Utility function to perform a Login operation
   * @param code String returned by ORCID API for login
   */
  const login = async (code: string): Promise<ResponseData<UserModel>> => {
    // Query to retrieve Entity data and associated data for editing
    const loginResponse = await doLogin({ variables: { code: code } });
    const loginData = loginResponse.data?.login;

    if (_.isUndefined(loginData) || loginData.success === false) {
      setIsAuthenticated(false);
      return {
        success: false,
        message: "Unable to log in",
        data: {} as UserModel,
      };
    }

    // Perform login and data retrieval via server, check if user permitted access
    removeCode();

    // Create a new token instance with an empty Workspace value
    setToken({
      ...loginData.data,
      workspace: "",
    });

    const userResponse = await getUser({
      variables: {
        _id: loginData.data.orcid,
      },
    });
    const userData = userResponse.data?.user;
    if (_.isUndefined(userData) || !_.isUndefined(userError)) {
      setIsAuthenticated(false);
      return {
        success: false,
        message: "Unable to retrieve User information",
        data: {} as UserModel,
      };
    }

    setIsAuthenticated(true);
    return {
      success: true,
      message: "Logged in successfully",
      data: userData,
    };
  };

  const value = useMemo(
    () => ({
      isAuthenticated: isAuthenticated,
      token: token,
      setToken: setToken,
      login: login,
      logout: logout,
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
