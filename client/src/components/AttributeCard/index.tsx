// React
import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ScaleFade,
  Stack,
  StackDivider,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";
import { BsCheckLg, BsPuzzle, BsXLg } from "react-icons/bs";

import _ from "lodash";

// Types
import { AttributeCardProps } from "@types";

// Custom components
import ParameterGroup from "@components/ParameterGroup";
import { WarningLabel } from "@components/Label";

const AttributeCard = (props: AttributeCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isEditing = _.isBoolean(props.editing) ? props.editing : false;

  // State to be updated
  const [description, setDescription] = useState(props.attribute.description);
  const [parameters, setParameters] = useState(props.attribute.parameters);

  // State to store original values
  const [defaultDescription, _setDefaultDescription] = useState(props.attribute.description);
  const [defaultParameters, _setDefaultParameters] = useState(props.attribute.parameters);

  return (
    <Card maxW={"md"} background={"white"}>
      <CardHeader p={"2"}>
        <Flex p={"2"} align={"center"} m={"none"} justify={"space-between"} gap={"4"}>
          <Flex align={"center"} gap={"2"}>
            <Icon as={BsPuzzle} w={"4"} h={"4"} />
            <Heading size={"md"} noOfLines={1}>{props.attribute.name}</Heading>
          </Flex>

          <Button onClick={onOpen} leftIcon={<InfoOutlineIcon />}>
            View
          </Button>
        </Flex>
      </CardHeader>

      <CardBody>
        <Flex direction={"column"} p={"sm"} gap={"6"} maxW={"md"}>
          <Stack divider={<StackDivider />}>
            <Text>
              {description.length > 0
                ? description
                : "No description provided."}
            </Text>

            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {parameters.map((parameter) => {
                switch (parameter.type) {
                  case "date": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={MdDateRange} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex
                              p={"1"}
                              m={"1"}
                            >
                              {parameter.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  case "entity": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={AiOutlineBlock} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex
                              p={"1"}
                              m={"1"}
                            >
                              {parameter.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  case "number": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={RiNumbersLine} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex
                              p={"1"}
                              m={"1"}
                            >
                              {parameter.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }

                  case "url": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={AiOutlineLink} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex
                              p={"1"}
                              m={"1"}
                            >
                              {parameter.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  default: {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={MdOutlineTextFields} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex
                              p={"1"}
                              m={"1"}
                            >
                              {parameter.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                }
              })}
            </Flex>
          </Stack>
        </Flex>
      </CardBody>

      <ScaleFade initialScale={0.9} in={isOpen}>
        <Modal onEsc={onClose} onClose={onClose} isOpen={isOpen} size={"3xl"} isCentered>
          <ModalOverlay />

          <ModalContent p={"2"} m={"2"}>
            <ModalHeader>
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
                wrap={"wrap"}
              >
                <Flex align={"center"} gap={"4"} shadow={"lg"} p={"2"} border={"2px"} rounded={"md"}>
                  <Icon as={BsPuzzle} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"} size={"md"}>{props.attribute.name}</Heading>
                </Flex>
              </Flex>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody gap={"4"}>
              <Flex mb={"4"}>
                {!isEditing ? (
                  description.length > 0 ? (
                    <Text>{description}</Text>
                  ) : (
                    <WarningLabel
                      key={props.attribute.name}
                      text={"No description provided"}
                    />
                  )
                ) : (
                  <Input value={description} onChange={(event) => setDescription(event.target.value)} />
                )}

              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"white"}
                rounded={"md"}
              >
                <Heading size={"md"}>Parameters</Heading>
                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  align={"center"}
                  justify={"center"}
                >
                  {parameters && parameters.length > 0 ? (
                    <ParameterGroup parameters={parameters} viewOnly={!isEditing} setParameters={setParameters} />
                  ) : (
                    <Text>No parameters.</Text>
                  )}
                </Flex>
              </Flex>

              {isEditing &&
                <Flex direction={"row"} justify={"center"} gap={"4"}>
                  <Button
                    colorScheme={"red"}
                    variant={"outline"}
                    rightIcon={<Icon as={BsXLg} />}
                    onClick={() => {
                      // Reset the changes made to the Attribute
                      setDescription(defaultDescription);
                      setParameters(defaultParameters);

                      // Close the modal
                      onClose();

                      // Run the 'cancel' action (if specified)
                      props.cancelCallback ? props.cancelCallback() : {};
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon as={BsCheckLg} />}
                    // disabled={isAttributeError}
                    onClick={() => {
                      // Close the modal
                      onClose();

                      // Run the 'done' action (if specified)
                      props.doneCallback ? props.doneCallback({ _id: props.attribute._id, name: props.attribute.name, description: description, parameters: parameters}) : {};
                    }}
                  >
                    Done
                  </Button>
                </Flex>
              }
            </ModalBody>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </Card>
  );
};

export default AttributeCard;
