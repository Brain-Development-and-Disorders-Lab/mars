import React from "react";
import { VStack, StackDivider, Spinner, Heading } from "@chakra-ui/react";

export const Loading = () => {
  return (
    <VStack align={"center"} justify={"center"} direction={"row"} gap={"3"}>
      <StackDivider h={"sm"} />
      <Spinner size="xl" />
      <Heading>Loading</Heading>
    </VStack>
  );
};
