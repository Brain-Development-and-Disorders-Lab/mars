import React from "react";
import {
  Flex,
  Heading,
} from "@chakra-ui/react";
import { ContentContainer } from "@components/ContentContainer";

import _ from "lodash";

export const Create = ({}) => {

  return (
    <ContentContainer>
      <Flex
        direction={"column"}
        justify={"center"}
        p={"2"}
        gap={"6"}
        maxW={"7xl"}
        wrap={"wrap"}
      >
        <Flex direction={"column"} w={"100%"} p={"2"} bg={"white"} rounded={"md"}>
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Heading fontWeight={"semibold"}>Create</Heading>

            </Flex>
          </Flex>

          <Flex
            direction={"row"}
            justify={"center"}
            align={"center"}
            gap={"6"}
            p={"2"}
            pb={"6"}
            mb={["12", "8"]}
          >
            <Heading>Attribute</Heading>
            <Heading>Collection</Heading>
            <Heading>Entity</Heading>
          </Flex>
        </Flex>
      </Flex>
    </ContentContainer>
  );
};
export default Create;
