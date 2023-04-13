import React from "react";
import { Flex } from "@chakra-ui/react";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Flex direction={"row"} h={"100vh"} w={"100vw"} p={"0"} m={"0"} bg={"whitesmoke"}>
      {children}
    </Flex>
  );
};
