import React from "react";
import { Flex, Spinner, Heading } from "@chakra-ui/react";

export const Loading = () => {
  return (
    <Flex
      h={"90vh"}
      align={"center"}
      justify={"center"}
      direction={"column"}
      gap={"3"}
    >
      <Spinner size="xl" />
      <Heading>Loading</Heading>
    </Flex>
  );
};
