import React from "react";
import { Flex } from "@chakra-ui/react";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex m={"2"} align={"center"} justify={"center"}>
      <Flex
        p={"2"}
        pt={"0"}
        direction={"column"}
        w={"full"}
        maxW={"7xl"}
        wrap={"wrap"}
        gap={"6"}
      >
        {children}
      </Flex>
    </Flex>
  );
};
