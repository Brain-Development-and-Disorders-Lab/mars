import React from "react";
import { Flex, Spinner } from "@chakra-ui/react";

export const Loading = () => {
  return (
    <Flex
      align={"center"}
      justify={"center"}
      direction={"column"}
      gap={"3"}
      p={"8"}
      m={"8"}
    >
      <Spinner size="xl" />
    </Flex>
  );
};
