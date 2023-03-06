import React, { useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import { PageContainer } from "@components/PageContainer";
import ParameterGroup from "@components/ParameterGroup";
import { useNavigate } from "react-router-dom";

import { AttributeStruct, Parameters } from "@types";
import { postData, pseudoId } from "@database/functions";

import _ from "underscore";
import consola from "consola";

export const Start = ({}) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    <PageContainer>
      <Flex direction={"column"} w={["full", "4xl", "7xl"]}>
        {/* Page header */}
        <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
          <Flex direction={"row"} align={"center"} justify={"space-between"}>
            <Heading fontWeight={"semibold"}>Create Attribute</Heading>
            <Button
              rightIcon={<InfoOutlineIcon />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

        <Flex
          direction={"column"}
          justify={"center"}
          align={"center"}
          gap={"6"}
          p={"2"}
          pb={"6"}
          mb={["12", "8"]}
        >
          <Flex
            direction={"column"}
            gap={"2"}
            w={["full", "4xl"]}
            maxW={"4xl"}
          >
            <Heading fontWeight={"semibold"} size={"lg"}>Details</Heading>
            <Text>
              Specify some basic details about this template Attribute. The
              metadata associated with this template should be specified using
              Parameters.
            </Text>
            <Flex direction="row" gap={"4"} wrap={["wrap", "nowrap"]}>
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
          </Flex>
          <ParameterGroup
            parameters={parameters}
            viewOnly={false}
            setParameters={setParameters}
          />
        </Flex>
      </Flex>

      {/* Action buttons */}
      <Flex
        direction={"row"}
        flexWrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        alignSelf={"center"}
        w={["sm", "xl", "3xl"]}
        maxW={"7xl"}
        p={"4"}
        m={"4"}
        position={"fixed"}
        bottom={"0%"}
        bg={"gray.50"}
        rounded={"20px"}
      >
        <Button
          colorScheme={"red"}
          variant={"outline"}
          rightIcon={<CloseIcon />}
          onClick={() => navigate("/attributes")}
        >
          Cancel
        </Button>
        <Button
          colorScheme={"green"}
          rightIcon={<CheckIcon />}
          onClick={onSubmit}
        >
          Finish
        </Button>
      </Flex>

      {/* Information modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Attributes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Individual pieces of metadata should be expressed as Parameters.
            </Text>
            <Text>There are five supported types of metadata:</Text>
            <List spacing={2}>
              <ListItem>
                <ListIcon as={MdDateRange} />
                <Text as={"b"}>Date</Text>
                {": "}Used to specify a point in time.
              </ListItem>
              <ListItem>
                <ListIcon as={MdOutlineTextFields} />
                <Text as={"b"}>String</Text>
                {": "}Used to specify text of variable length.
              </ListItem>
              <ListItem>
                <ListIcon as={RiNumbersLine} />
                <Text as={"b"}>Number</Text>
                {": "}Used to specify a numerical value.
              </ListItem>
              <ListItem>
                <ListIcon as={AiOutlineLink} />
                <Text as={"b"}>URL</Text>
                {": "}Used to specify a link.
              </ListItem>
              <ListItem>
                <ListIcon as={AiOutlineBlock} />
                <Text as={"b"}>Entity</Text>
                {": "}Used to specify a relation to another Entity.
              </ListItem>
            </List>
            <Text>Parameters can be specified using the buttons.</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};
export default Start;
