import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
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
import { CheckIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import { BsXLg } from "react-icons/bs";
import { ContentContainer } from "@components/ContentContainer";
import ParameterGroup from "@components/ParameterGroup";
import { useNavigate } from "react-router-dom";

import { Attribute, Parameters } from "@types";
import { postData } from "@database/functions";
import { validateParameters } from "src/functions";

import _ from "lodash";

export const Start = ({}) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState([] as Parameters[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Various validation error states
  const isNameError = name === "";
  const isDescriptionError = description === "";
  const isParametersError = parameters.length === 0;
  const [parameterError, setParameterError] = useState(false);
  const isDetailsError = isNameError || isDescriptionError || isParametersError || !parameterError;

  const attributeData: Attribute = {
    name: name,
    description: description,
    parameters: parameters,
  };

  useEffect(() => {
    setParameterError(validateParameters(parameters, true));
  }, [parameters]);

  const onSubmit = () => {
    setIsSubmitting(true);
    // Push the data
    postData(`/attributes/create`, attributeData).then(() => {
      setIsSubmitting(false);
      navigate("/attributes");
    });
  };

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
            <Flex direction={"column"} w={"100%"}>
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <Text>
                Specify some basic details about this template Attribute. The
                metadata associated with this template should be specified using
                Parameters.
              </Text>
            </Flex>

            <Flex direction={"row"} gap={"2"} w={"100%"} maxW={"4xl"}>
              <Flex direction={"column"} gap={"4"} wrap={["wrap", "nowrap"]}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    placeholder={"Name"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  {!isNameError ? (
                    <FormHelperText>Name of the Attribute.</FormHelperText>
                  ) : (
                    <FormErrorMessage>A name must be specified for the Attribute.</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    placeholder={"Attribute Description"}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                  {!isDescriptionError ? (
                    <FormHelperText>Description of the Attribute.</FormHelperText>
                  ) : (
                    <FormErrorMessage>A description should be provided for the Attribute.</FormErrorMessage>
                  )}
                </FormControl>
              </Flex>

              <Flex>
                <FormControl isRequired isInvalid={isParametersError}>
                  <FormLabel>Parameters</FormLabel>
                  <ParameterGroup
                    parameters={parameters}
                    viewOnly={false}
                    setParameters={setParameters}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>

          {/* Action buttons */}
          <Flex p={"2"} alignSelf={"center"} gap={"8"}>
            <Button
              colorScheme={"red"}
              variant={"outline"}
              rightIcon={<BsXLg />}
              onClick={() => navigate("/attributes")}
            >
              Cancel
            </Button>
            <Button
              colorScheme={"green"}
              rightIcon={<CheckIcon />}
              onClick={onSubmit}
              isDisabled={isDetailsError && !isSubmitting}
            >
              Finish
            </Button>
          </Flex>
        </Flex>
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
    </ContentContainer>
  );
};
export default Start;
