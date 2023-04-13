import React from "react";
import { Flex } from "@chakra-ui/react";

// Custom components
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={{base: "column", sm: "row"}} h={"100vh"} w={"100vw"} p={"0"} m={"0"}>
      <Navigation />
      <Flex direction={"column"} w={"100%"}>
        <Flex h={"6vh"} bg={"white"} align={"center"} justify={"center"} display={{ base: "none", sm: "flex" }}>
          <SearchBox />
        </Flex>
        <Flex p={"2"}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  );
};
