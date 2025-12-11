// React
import React, { FC } from "react";

// Existing and custom components
import { Flex } from "@chakra-ui/react";
import Navigation from "@components/Navigation";
import Error from "@components/Error";
import Loading from "@components/Loading";
import { Toaster } from "@components/Toast";
import ErrorBoundary from "@components/ErrorBoundary";

// Existing and custom types
import { ContentProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";
import { Navigate, Outlet } from "react-router-dom";

// Content container
const Content: FC<ContentProps> = ({ children, isError, isLoaded }) => {
  // Check values and set defaults if required
  if (_.isUndefined(isError)) isError = false;
  if (_.isUndefined(isLoaded)) isLoaded = true;

  return (
    <Flex
      direction={"column"}
      w={"100%"}
      minW="0"
      maxW="100%"
      minH={{ base: "92vh", lg: "100vh" }}
      maxH={{ base: "100%" }}
      overflowY={"auto"}
      overflowX={"hidden"}
      p={"1.5"}
    >
      {/* Toast notification provider */}
      <Toaster />

      {/* Present an error screen */}
      {isError && <Error />}

      {/* Present a loading screen */}
      {!isLoaded && !isError && <Loading />}

      {/* Show children once done loading and no errors present */}
      {isLoaded && !isError && children}
    </Flex>
  );
};

// Page container
const Page: FC = () => {
  // Observe the authentication state
  const { token } = useAuthentication();

  if (token.token === "") {
    // If not authenticated, return the user to the Login page
    return <Navigate to={"/login"} />;
  } else if (token.setup === false) {
    return <Navigate to={"/setup"} />;
  } else {
    // Display content
    return (
      <Flex
        direction={{ base: "column", lg: "row" }}
        w={"100%"}
        p={"0"}
        m={"0"}
      >
        {/* Navigation component */}
        <Flex
          justify={"center"}
          w={{ base: "100%", lg: "200px" }}
          minW={{ lg: "200px" }}
          h={{ base: "8vh", lg: "100%" }}
          position={"fixed"}
          borderRight={"1px"}
          borderBottom={"1px"}
          borderColor={"gray.300"}
          bg={"white"}
          zIndex={2}
        >
          <Navigation />
        </Flex>

        <Flex
          direction={"column"}
          w={"100%"}
          minW="0"
          maxW="100%"
          ml={{ base: "0", lg: "200px" }}
          mt={{ base: "8vh", lg: "0" }}
          overflowX="hidden"
        >
          {/* Main content components */}
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Flex>
      </Flex>
    );
  }
};

export { Content, Page };
