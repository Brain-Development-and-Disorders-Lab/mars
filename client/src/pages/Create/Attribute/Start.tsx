// React and Grommet
import React, { useState } from "react";
import { Button, Flex, Heading, Input, List, ListIcon, ListItem, Text, Textarea } from "@chakra-ui/react";
import { CheckIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import ParameterGroup from "src/components/ParameterGroup";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility library
import _ from "underscore";

// Consola
import consola from "consola";

// Parameter components and custom types
import { AttributeStruct, Parameters } from "types";

// Database functions
import { postData, pseudoId } from "src/database/functions";

export const Start = ({}) => {
  const navigate = useNavigate();

  const [name, setName] = useState(pseudoId("attribute"));
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState([] as Parameters[]);

  const attributeData: AttributeStruct = {
    name: name,
    description: description,
    parameters: parameters,
  };

  const onSubmit = () => {
    // Push the data
    consola.debug("Creating Attribute:", attributeData);
    postData(`/attributes/create`, attributeData).then(() =>
      navigate("/attributes")
    );
  };

  return (
    <Flex m={["0", "2"]} p={["2", "4"]} direction={"column"} align={"center"} justify={"center"}>
      <Flex direction={"column"} maxW={"7xl"} p={"4"} align={"center"} rounded={"xl"}>
        <Flex direction={"column"} p={"2"} pt={"8"} pb={"8"} >
          <Flex direction={"row"}>
            <Heading size={"2xl"}>Create Attribute</Heading>
          </Flex>
        </Flex>

        <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} justify={"space-between"} gap={"6"}>
          <Flex direction={"column"} gap={"2"} grow={"1"} maxW={"md"} p={"2"} rounded={"2xl"}>
            <Heading size={"xl"} margin={"xs"}>
              Details
            </Heading>
            <Text>
              Specify some basic details about this template Attribute.
              The metadata associated with this template should be specified using Parameters.
            </Text>
            <Input
              placeholder={"Attribute Name"}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Textarea
              value={description}
              placeholder={"Attribute Description"}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Flex>

          <Flex direction={"column"} gap={"2"} h={"fit-content"} p={"4"} maxW={"md"} rounded={"2xl"} border={"1px"} borderColor={"gray.200"}>
            <Flex align={"center"} gap={"2"}><InfoOutlineIcon boxSize={"8"} /><Heading>Parameters</Heading></Flex>
            <Text>Individual pieces of metadata should be expressed as Parameters.</Text>
            <Text>There are five supported types of metadata:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={MdDateRange} />
                <Text as={"b"}>Date</Text>{": "}Used to specify a point in time.
              </ListItem>
              <ListItem>
                <ListIcon as={MdOutlineTextFields} />
                <Text as={"b"}>String</Text>{": "}Used to specify text of variable length.
              </ListItem>
              <ListItem>
                <ListIcon as={RiNumbersLine} />
                <Text as={"b"}>Number</Text>{": "}Used to specify a numerical value.
              </ListItem>
              <ListItem>
                <ListIcon as={AiOutlineLink} />
                <Text as={"b"}>URL</Text>{": "}Used to specify a link.
              </ListItem>
              <ListItem>
                <ListIcon as={AiOutlineBlock} />
                <Text as={"b"}>Entity</Text>{": "}Used to specify a relation to another Entity.
              </ListItem>
            </List>
            <Text>Parameters can be specified using the buttons below.</Text>
          </Flex>
        </Flex>

        <ParameterGroup parameters={parameters} viewOnly={false} setParameters={setParameters} />

        {/* Action buttons */}
        <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"} justify={"space-between"}>
          <Button colorScheme={"red"} variant={"outline"} rightIcon={<CloseIcon />} onClick={() => navigate("/attributes")}>
            Cancel
          </Button>
          <Button colorScheme={"green"} rightIcon={<CheckIcon />} onClick={onSubmit}>
            Finish
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
export default Start;
