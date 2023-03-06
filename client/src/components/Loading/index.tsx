import React from "react";
import { Flex, Spinner, Heading } from "@chakra-ui/react";

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
      <Heading fontWeight={"semibold"}>Loading</Heading>
    </Flex>
  );
};
