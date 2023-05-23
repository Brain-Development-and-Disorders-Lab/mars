import React from "react";
import { Flex } from "@chakra-ui/react";

// Custom components
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={{base: "column", md: "row"}} minH={"100vh"} w={"100%"} p={"0"} m={"0"}>
      <Navigation />
      <Flex direction={"column"} w={"100%"}>
        <Flex w={"100%"} h={"6vh"} align={"center"} justify={"center"} display={{ base: "none", md: "flex" }}><SearchBox /></Flex>
        <Flex p={"2"} position={"relative"} h={"100%"} background={"gray.50"}>{ children }</Flex>
      </Flex>
    </Flex>
  );
};
