// React
import React, { FC } from "react";

// Existing and custom components
import { Flex } from "@chakra-ui/react";
import SearchBox from "@components/SearchBox";
import Navigation from "@components/Navigation";

// Content container
const Content: FC<any> = (props: { children: any; vertical?: boolean }) => {
  return (
    <Flex
      flex={"1"}
      align={props.vertical && props.vertical ? "center" : ""}
      justify={"center"}
    >
      <Flex
        direction={"column"}
        w={"full"}
        maxW={"7xl"}
        wrap={"wrap"}
        gap={"6"}
        h={"auto"}
      >
        {props.children}
      </Flex>
    </Flex>
  );
};

// Page container
const Page: FC<any> = ({ children }) => {
  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      minH={"100vh"}
      w={"100%"}
      p={"0"}
      m={"0"}
    >
      {/* Navigation component */}
      <Flex p={"4"} h={"100%"} justify={"center"} background={"white"} zIndex={"2"}>
        <Navigation />
      </Flex>

      <Flex direction={"column"} w={"100%"}>
        {/* Search box component */}
        <Flex
          w={"100%"}
          h={"6vh"}
          align={"center"}
          justify={"center"}
          display={{ base: "none", lg: "flex" }}
          zIndex={"1"}
          background={"white"}
          position={{lg: "sticky"}}
          top={{lg: "0"}}
        >
          <SearchBox />
        </Flex>

        {/* Main content components */}
        <Flex p={"2"} h={"100%"} background={"gray.50"}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  );
};

export { Content, Page };
