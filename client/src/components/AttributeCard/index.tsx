// React
import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Icon,
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
import { BsGear } from "react-icons/bs";

import _ from "underscore";

// Types
import { AttributeCardProps } from "@types";

// Custom components
import ParameterGroup from "@components/ParameterGroup";
import { WarningLabel } from "@components/Label";

const AttributeCard = (props: AttributeCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Card maxW={"md"} background={"white"}>
      <CardHeader p={"2"}>
        <Flex p={"2"} align={"center"} m={"none"} justify={"space-between"} gap={"4"}>
          <Flex align={"center"} gap={"2"}>
            <Icon as={BsGear} w={"4"} h={"4"} />
            <Heading size={"md"} noOfLines={1}>{props.data.name}</Heading>
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
              {props.data.description.length > 0
                ? props.data.description
                : "No description provided."}
            </Text>

            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {props.data.parameters.map((parameter) => {
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
        <Modal onEsc={onClose} onClose={onClose} isOpen={isOpen} isCentered>
          <ModalOverlay />

          <ModalContent p={"2"} m={"2"}>
            <ModalHeader>
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
                wrap={"wrap"}
              >
                <Flex align={"center"} gap={"4"} shadow={"lg"} p={"2"} border={"2px"} rounded={"10px"}>
                  <Icon as={BsGear} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"} size={"md"}>{props.data.name}</Heading>
                </Flex>
              </Flex>
              <ModalCloseButton />
            </ModalHeader>
            <ModalBody gap={"4"}>
              <Flex mb={"4"}>
                {props.data.description.length > 0 ? (
                  <Text>{props.data.description}</Text>
                ) : (
                  <WarningLabel
                    key={props.data.name}
                    text={"No description provided"}
                  />
                )}
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"whitesmoke"}
                rounded={"10px"}
              >
                <Heading size={"md"}>Parameters</Heading>
                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  align={"center"}
                  justify={"center"}
                >
                  {props.data.parameters && props.data.parameters.length > 0 ? (
                    <ParameterGroup parameters={props.data.parameters} viewOnly />
                  ) : (
                    <Text>No parameters.</Text>
                  )}
                </Flex>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </Card>
  );
};

export default AttributeCard;
