// React
import React, { FC } from "react";

// Existing and custom components
import { Avatar, Flex, Spacer } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

// Content container
const Content: FC<any> = (props: { children: any; vertical?: boolean }) => {
  return (
    <Flex
      align={props.vertical && props.vertical ? "center" : ""}
      justify={"center"}
    >
      <Flex
        direction={"column"}
        wrap={"wrap"}
        justify={"center"}
        gap={"6"}
        p={"4"}
        h={"auto"}
        w={"100%"}
        maxW={"7xl"}
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
      <Flex p={"4"} minH={["", "100vh"]} justify={"center"} background={"white"}>
        <Navigation />
      </Flex>

      <Flex direction={"column"} minH={["", "100vh"]} w={"100%"}>
        {/* Search box component */}
        <Flex
          w={"100%"}
          h={"6vh"}
          align={"center"}
          display={{ base: "none", lg: "flex" }}
          background={"white"}
        >
          <Spacer />

          <SearchBox />

          <Spacer />

          <Flex p={"4"} gap={"4"} align={"center"}>
            <Icon name={"bell"} size={[5, 5]} />
            <Avatar size={"sm"} />
          </Flex>
        </Flex>

        {/* Main content components */}
        {children}
      </Flex>
    </Flex>
  );
};

export { Content, Page };
