// React
import React, { FC } from "react";

// Existing and custom components
import { Flex, Spacer } from "@chakra-ui/react";
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";
import Error from "@components/Error";
import Loading from "@components/Loading";
import AccountMenu from "@components/AccountMenu";

// Existing and custom types
import { ContentProps, PageProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Content container
const Content: FC<ContentProps> = ({ children, isError, isLoaded }) => {
  // Check values and set defaults if required
  if (_.isUndefined(isError)) isError = false;
  if (_.isUndefined(isLoaded)) isLoaded = true;

  return (
    <Flex
      direction={"column"}
      wrap={"wrap"}
      gap={"6"}
      w={"100%"}
      h={"100%"}
      maxH={{ base: "100%", lg: "92vh" }}
      overflowY={"auto"}
    >
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
const Page: FC<PageProps> = ({ children }) => {
  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      minH={"100vh"}
      w={"100%"}
      p={"0"}
      m={"0"}
    >
      {/* Navigation component */}
      <Flex
        p={"4"}
        justify={"center"}
        w={{ base: "100%", lg: "15%" }}
        borderBottom={{ base: "1px", lg: "none" }}
        borderColor={{ base: "gray.100", lg: "gray.100" }}
      >
        <Navigation />
      </Flex>

      <Flex
        direction={"column"}
        w={{ base: "100%", lg: "85%" }}
        borderLeft={{ base: "none", lg: "1px" }}
        borderColor={{ base: "gray.100", lg: "gray.100" }}
      >
        {/* Search box component */}
        <Flex
          w={"100%"}
          h={"8vh"}
          align={"center"}
          display={{ base: "none", lg: "flex" }}
          background={"white"}
          borderBottom={"1px"}
          borderColor={"gray.100"}
        >
          <Spacer />
          <SearchBox />
          <Spacer />
          <AccountMenu />
        </Flex>

        {/* Main content components */}
        {children}
      </Flex>
    </Flex>
  );
};

export { Content, Page };
