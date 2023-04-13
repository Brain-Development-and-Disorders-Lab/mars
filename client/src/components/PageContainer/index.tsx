import React from "react";
import { Flex } from "@chakra-ui/react";

// Custom components
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={"row"} h={"100vh"} w={"100vw"} p={"0"} m={"0"} bg={"gray.50"}>
      <Navigation />
      <Flex direction={"column"} w={"100%"}>
        <Flex h={"6vh"} bg={"white"} align={"center"} justify={"center"}>
          <SearchBox />
        </Flex>
        <Flex p={"2"}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  );
};
