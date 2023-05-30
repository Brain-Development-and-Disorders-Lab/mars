// React
import React, { FC } from "react";

// Existing and custom components
import { Flex } from "@chakra-ui/react";

const ContentContainer: FC<any> = (props: { children: any, vertical?: boolean }) => {
  return (
    <Flex
      flex={"1"}
      align={props.vertical && props.vertical ? "center" : ""}
      justify={"center"}
    >
      <Flex
        direction={"column"}
        w={"full"}
        maxW={"7xl"}
        wrap={"wrap"}
        gap={"6"}
        h={"auto"}
      >
        {props.children}
      </Flex>
    </Flex>
  );
};

export default ContentContainer;
