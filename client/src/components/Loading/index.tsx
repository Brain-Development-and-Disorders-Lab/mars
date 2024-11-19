// React
import React from "react";

// Existing and custom components
import { Flex, Spinner } from "@chakra-ui/react";

const Loading = () => {
  return (
    <Flex
      align={"center"}
      justify={"center"}
      direction={"column"}
      gap={"3"}
      p={"8"}
      m={"8"}
      minH={"90vh"}
      h={"100%"}
    >
      <Spinner size="xl" />
    </Flex>
  );
};

export default Loading;
