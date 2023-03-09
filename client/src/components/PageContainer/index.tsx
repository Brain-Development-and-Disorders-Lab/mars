import React from "react";
import { Box } from "@chakra-ui/react";

export const PageContainer: React.FC<any> = ({ children }) => {
  return (
    <Box h={"100vh"} w={"100vw"} p={"0"} m={"0"}>
      {children}
    </Box>
  );
};
