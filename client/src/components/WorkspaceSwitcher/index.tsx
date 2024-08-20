import React from "react";
import { Flex, Select } from "@chakra-ui/react";

const WorkspaceSwitcher = () => {
  return (
    <Flex>
      <Select size={"sm"} rounded={"md"} bg={"white"}>
        <option>Workspace</option>
      </Select>
    </Flex>
  );
};

export default WorkspaceSwitcher;
