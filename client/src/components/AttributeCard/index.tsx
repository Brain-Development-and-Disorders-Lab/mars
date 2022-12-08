// React
import React from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Flex, Heading, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, ScaleFade, Tag, TagLabel, TagLeftIcon, Text, useDisclosure } from "@chakra-ui/react";
import { CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";

import _ from "underscore";

// Types
import { AttributeCardProps } from "types";

// Custom components
import ParameterGroup from "../ParameterGroup";
import { WarningLabel } from "../Label";

const AttributeCard = (props: AttributeCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Card w={"md"} onClick={onOpen}>
        <CardHeader>
          <Flex p={"sm"} align={"center"} m="none" justify="start" gap="small">
            <Heading size={"md"}>{props.data.name}</Heading>
          </Flex>
        </CardHeader>

        <CardBody>
          <Flex direction={"column"} p={"sm"} gap={"6"} maxW={"md"}>
            <Flex>
              <Text noOfLines={3}>
                {props.data.description.length > 0 ?
                  props.data.description
                :
                  "No description."
                }
              </Text>
            </Flex>

            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {props.data.parameters.map((parameter) => {
                switch (parameter.type) {
                  case "date": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={MdDateRange} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"} rounded={"md"} background={"white"}>{parameter.name}</Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  };
                  case "entity": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={AiOutlineBlock} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"} rounded={"md"} background={"white"}>{parameter.name}</Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  };
                  case "number": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={RiNumbersLine} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"} rounded={"md"} background={"white"}>{parameter.name}</Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  };
                  
                  case "url": {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={AiOutlineLink} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"} rounded={"md"} background={"white"}>{parameter.name}</Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  };
                  default: {
                    return (
                      <Tag key={parameter.identifier}>
                        <TagLeftIcon as={MdOutlineTextFields} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"} rounded={"md"} background={"white"}>{parameter.name}</Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  };
                };
              })}
            </Flex>
          </Flex>
        </CardBody>

        <CardFooter justify={"right"}>
          <Button onClick={onOpen} rightIcon={<InfoOutlineIcon />}>View Details</Button>
        </CardFooter>
      </Card>

      <ScaleFade initialScale={0.9} in={isOpen}>
        <Modal onEsc={onClose} onClose={onClose} isOpen={isOpen} size={"3xl"}>
          <ModalOverlay />
          <ModalContent p={"2"}>
            <ModalHeader><Heading size={"md"}>Attribute: {props.data.name}</Heading></ModalHeader>
            <ModalBody>
              {props.data.description.length > 0 ?
                <Text>{props.data.description}</Text>
              :
                <WarningLabel key={props.data.name} text={"No description"} />
              }

              <Flex direction={"column"} p={"2"} gap={"2"}>
                {props.data.parameters && props.data.parameters.length > 0 ?
                  <ParameterGroup parameters={props.data.parameters} viewOnly />
                :
                  <Text>No parameters.</Text>
                }
              </Flex>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} rightIcon={<CloseIcon />}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </>
  );
};

export default AttributeCard;
