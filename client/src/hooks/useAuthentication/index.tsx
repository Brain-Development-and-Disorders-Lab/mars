import React, { createContext, useContext, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Token management
import { useToken } from "@hooks/useToken";

// Custom types
import { IAuth, IResponseMessage, ResponseData, UserModel } from "@types";

// GraphQL
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Utility functions and libraries
import _ from "lodash";

// Posthog
import { usePostHog } from "posthog-js/react";

type AuthenticationContextValue = {
  token: IAuth;
  setToken: (token: IAuth) => void;
  login: (code: string) => Promise<IResponseMessage>;
  logout: () => void;
  setup: (user: Partial<UserModel>) => Promise<IResponseMessage>;
};
const AuthenticationContext = createContext({} as AuthenticationContextValue);

export const AuthenticationProvider = (props: {
  children: React.JSX.Element;
}) => {
  const posthog = usePostHog();
  const navigate = useNavigate();

  // Setup AuthenticationContext state components
  const [token, setToken] = useToken();

  // Access parameters to remove code after authentication
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [getUser, { error: getUserError }] = useLazyQuery<{ user: UserModel }>(
    GET_USER,
  );

  // Query to update User
  const UPDATE_USER = gql`
    mutation UpdateUser($user: UserInput) {
      updateUser(user: $user) {
        success
        message
      }
    }
  `;
  const [updateUser, { error: updateUserError }] = useMutation<{
    updateUser: IResponseMessage;
  }>(UPDATE_USER);

  // Check the "setup" state of a User
  const isValidUser = (user: Partial<UserModel>): boolean => {
    // Return `false` if the following required fields are undefined or in the default state
    if (_.isUndefined(user) || _.isNull(user)) return false;
    if (_.isUndefined(user.firstName) || _.isEqual(user.firstName, ""))
      return false;
    if (_.isUndefined(user.lastName) || _.isEqual(user.lastName, ""))
      return false;
    if (_.isUndefined(user.email) || _.isEqual(user.email, "")) return false;
    if (_.isUndefined(user.affiliation) || _.isEqual(user.affiliation, ""))
      return false;

    // Return `true` if all information is complete
    return true;
  };

  // Remove the "code" search parameter upon login
  const removeCode = () => {
    if (searchParams.has("code")) {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
  };

  /**
   * Function to log out the current user, resets the token to default values and navigates
   * to the `/login` path
   */
  const logout = () => {
    // Invalidate the token
    setToken({
      orcid: token.orcid,
      token: "",
      setup: false,
      firstLogin: false,
    });

    // Reset Posthog
    posthog.reset();

    // Navigate to the login page
    navigate("/login");
  };

  /**
   * Utility function that logs in the current user and updates the token with received values
   * @param code returned by ORCID API for login
   */
  const login = async (code: string): Promise<IResponseMessage> => {
    // Query to retrieve Entity data and associated data for editing
    const loginResponse = await doLogin({ variables: { code: code } });
    const loginData = loginResponse.data?.login;

    if (_.isUndefined(loginData)) {
      return {
        success: false,
        message: "Unable to log in, check network connection",
      };
    }

    // Create a new token instance
    setToken(loginData.data);

    // Get the User
    const userResponse = await getUser({
      variables: { _id: loginData.data.orcid },
    });
    const userData = userResponse.data?.user;

    if (!_.isUndefined(getUserError) || _.isUndefined(userData)) {
      return {
        success: false,
        message: "Unable to retrieve User information",
      };
    }

    // Update the User and authentication state
    setToken({
      orcid: loginData.data.orcid,
      token: loginData.data.token,
      setup: isValidUser(userData),
      firstLogin: false,
    });

    // Remove the login code from the current URL
    removeCode();

    // Update session identifier for Posthog
    posthog.identify(loginData.data.orcid, {
      name: `${userData.firstName} ${userData.lastName}`,
    });

    return {
      success: true,
      message: "Logged in successfully",
    };
  };

  /**
   * Setup operation to create a new `UserModel` instance and update the token data
   * @param user Data provided by the user to create a `UserModel` instance
   * @return {Promise<IResponseMessage>}
   */
  const setup = async (user: Partial<UserModel>): Promise<IResponseMessage> => {
    const result = await updateUser({
      variables: {
        user: {
          _id: token.orcid,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          affiliation: user.affiliation,
        },
      },
    });

    if (
      updateUserError ||
      _.isUndefined(result) ||
      (result.data && result.data.updateUser.success === false)
    ) {
      return {
        success: false,
        message: "Could not run User setup",
      };
    }

    setToken({
      orcid: token.orcid,
      token: token.token,
      setup: isValidUser(user),
      firstLogin: true,
    });

    return {
      success: true,
      message: "User setup successful",
    };
  };

  const value = useMemo(
    () => ({
      token,
      setToken,
      login,
      logout,
      setup,
    }),
    [token],
  );

  // Return the `React.Context` component
  return (
    <AuthenticationContext.Provider value={value}>
      {props.children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => {
  return useContext(AuthenticationContext);
};
