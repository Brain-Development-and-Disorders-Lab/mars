import React from "react";
import { Flex } from "@chakra-ui/react";

// Custom components
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={{base: "column", sm: "row"}} minH={"100vh"} w={"100%"} p={"0"} m={"0"}>
      <Navigation />
      <Flex direction={"column"} w={"100%"}>
        <Flex w={"100%"} h={"6vh"} bg={"white"} align={"center"} justify={"center"} display={{ base: "none", sm: "flex" }} position={"fixed"} zIndex={10}>
          <SearchBox />
        </Flex>
        <Flex p={"2"} position={"relative"} top={{ base: "0", sm: "6vh" }}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  );
};
