import React from "react";
import { Flex } from "@chakra-ui/react";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={"column"} h={"100vh"} w={"100vw"} p={"0"} m={"0"}>
      {children}
    </Flex>
  );
};
