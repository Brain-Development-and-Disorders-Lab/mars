// React
import React, { FC, useEffect, useState } from "react";

// Existing and custom components
import { Flex } from "@chakra-ui/react";
import Navigation from "@components/Navigation";
import Error from "@components/Error";
import Loading from "@components/Loading";
import { toaster, Toaster } from "@components/Toast";
import ErrorBoundary from "@components/ErrorBoundary";

// Existing and custom types
import { ContentProps, PageProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Routing and navigation
import { Navigate, Outlet, useParams } from "react-router-dom";

// Authentication
import { auth } from "@lib/auth";

// Analytics
import posthog from "posthog-js";

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
      bg={"surface.subtle"}
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
const Page: FC<PageProps> = (props: PageProps) => {
  // Authentication state
  const { data: session, isPending: isSessionPending, error: sessionErrorState } = auth.useSession();

  // Error state
  const [sessionError, setSessionError] = useState(false);

  // `true` when the user authenticated via a third-party but hasn't completed their profile
  const [incompleteProfile, setIncompleteProfile] = useState(false);

  // Route param carrying the public Workspace identifier
  const { id } = useParams();

  // Validate session and check profile completion state once the session settles
  useEffect(() => {
    if (props.isPublic || isSessionPending) return;

    if (sessionErrorState || !session) {
      // Issue retrieving session
      toaster.create({
        title: "Error",
        description: "Session expired, please login again",
        type: "error",
        duration: 4000,
        closable: true,
      });
      setSessionError(true);
      return;
    }

    // Successfully obtained session
    posthog.identify(session.user.id, {
      email: session.user.email,
      name: session.user.name,
    });

    // Force user to the profile completion page if required
    if (session.user.completedProfile === false) {
      setIncompleteProfile(true);
    }
  }, [props.isPublic, isSessionPending, sessionErrorState, session]);

  if (!props.isPublic) {
    if (incompleteProfile) {
      return <Navigate to={"/signup"} />;
    }

    if (session) {
      // Display content
      return (
        <Flex direction={{ base: "column", lg: "row" }} w={"100%"} p={"0"} m={"0"}>
          {/* Navigation component */}
          <Flex
            justify={"center"}
            w={{ base: "100%", lg: "200px" }}
            minW={{ lg: "200px" }}
            h={{ base: "8vh", lg: "100%" }}
            position={"fixed"}
            bg={"nav.bg"}
            zIndex={2}
          >
            <Navigation isPublic={false} />
          </Flex>

          <Flex
            direction={"column"}
            w={"100%"}
            minW="0"
            maxW="100%"
            minH={{ base: "92vh", lg: "100vh" }}
            ml={{ base: "0", lg: "200px" }}
            mt={{ base: "8vh", lg: "0" }}
            overflowX="hidden"
            bg={"surface.subtle"}
          >
            {/* Main content components */}
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Flex>
        </Flex>
      );
    } else if (sessionError) {
      // Navigate to login on error
      return <Navigate to={"/login"} />;
    } else {
      // Loading screen
      return <Loading />;
    }
  } else {
    // Display content
    return (
      <Flex direction={{ base: "column", lg: "row" }} w={"100%"} p={"0"} m={"0"}>
        {/* Navigation component */}
        <Flex
          justify={"center"}
          w={{ base: "100%", lg: "200px" }}
          minW={{ lg: "200px" }}
          h={{ base: "8vh", lg: "100%" }}
          position={"fixed"}
          bg={"nav.bg"}
          zIndex={2}
        >
          <Navigation isPublic={true} workspace={id} />
        </Flex>

        <Flex
          direction={"column"}
          w={"100%"}
          minW="0"
          maxW="100%"
          minH={{ base: "92vh", lg: "100vh" }}
          ml={{ base: "0", lg: "200px" }}
          mt={{ base: "8vh", lg: "0" }}
          overflowX="hidden"
          bg={"surface.subtle"}
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
