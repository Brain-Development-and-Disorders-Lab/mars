import React from "react";
import { Flex } from "@chakra-ui/react";

export const ContentContainer: React.FC<any> = (props: { children: any, vertical?: boolean }) => {
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
