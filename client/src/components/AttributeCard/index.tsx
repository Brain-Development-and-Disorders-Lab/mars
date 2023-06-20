// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ScaleFade,
  Tag,
  TagLabel,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Values from "@components/Values";
import { Warning } from "@components/Label";

// Existing and custom types
import { AttributeCardProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

const AttributeCard = (props: AttributeCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isEditing = _.isBoolean(props.editing) ? props.editing : false;

  // State to be updated
  const [description, setDescription] = useState(props.attribute.description);
  const [values, setValues] = useState(props.attribute.values);

  // State to store original values
  const [defaultDescription, _setDefaultDescription] = useState(
    props.attribute.description
  );
  const [defaultValues, _setDefaultValues] = useState(props.attribute.values);

  return (
    <Card maxW={"md"} background={"white"} variant={"outline"}>
      <CardHeader p={"2"}>
        <Flex
          p={"2"}
          align={"center"}
          m={"none"}
          justify={"space-between"}
          gap={"4"}
        >
          <Flex
            align={"center"}
            gap={"4"}
            shadow={"lg"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
            bg={"white"}
          >
            <Icon name={"attribute"} size={"md"} />
            <Heading size={"md"} noOfLines={1}>
              {props.attribute.name}
            </Heading>
          </Flex>

          <Flex align={"center"} gap={"2"}>
            {isEditing ? (
              <IconButton
                aria-label={"Edit Attribute"}
                onClick={onOpen}
                icon={<Icon name={"edit"} />}
              />
            ) : (
              <Button
                colorScheme={"blackAlpha"}
                onClick={onOpen}
                rightIcon={<Icon name={"c_right"} />}
              >
                View
              </Button>
            )}

            {isEditing && props.removeCallback && (
              <IconButton
                aria-label={"Remove Attribute"}
                key={`remove-${props.attribute._id}`}
                icon={<Icon name={"delete"} />}
                colorScheme={"red"}
                onClick={props.removeCallback}
              />
            )}
          </Flex>
        </Flex>
      </CardHeader>

      <CardBody>
        <Flex direction={"column"} p={"1"} gap={"2"} maxW={"sm"}>
          <Flex gap={"2"} direction={"column"}>
            <Heading size={"sm"} fontWeight={"semibold"}>
              Description
            </Heading>
            <Text noOfLines={2}>
              {description.length > 0
                ? description
                : "No description provided."}
            </Text>
          </Flex>

          <Divider />

          <Flex gap={"2"} direction={"column"}>
            <Heading size={"sm"} fontWeight={"semibold"}>
              Values
            </Heading>
            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
              {values.map((value) => {
                switch (value.type) {
                  case "date": {
                    return (
                      <Tag key={value.identifier}>
                        <Icon name={"v_date"} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"}>
                              {value.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  case "entity": {
                    return (
                      <Tag key={value.identifier}>
                        <Icon name={"entity"} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"}>
                              {value.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  case "number": {
                    return (
                      <Tag key={value.identifier}>
                        <Icon name={"v_number"} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"}>
                              {value.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }

                  case "url": {
                    return (
                      <Tag key={value.identifier}>
                        <Icon name={"v_url"} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"}>
                              {value.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                  default: {
                    return (
                      <Tag key={value.identifier}>
                        <Icon name={"v_text"} />
                        <TagLabel>
                          <Flex align={"center"} gap={"1"}>
                            <Flex p={"1"} m={"1"}>
                              {value.name}
                            </Flex>
                          </Flex>
                        </TagLabel>
                      </Tag>
                    );
                  }
                }
              })}
            </Flex>
          </Flex>
        </Flex>
      </CardBody>

      <ScaleFade initialScale={0.9} in={isOpen}>
        <Modal
          onEsc={onClose}
          onClose={onClose}
          isOpen={isOpen}
          size={"3xl"}
          isCentered
        >
          <ModalOverlay />

          <ModalContent p={"2"} m={"2"}>
            <ModalHeader>
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
                wrap={"wrap"}
              >
                <Flex
                  align={"center"}
                  gap={"4"}
                  shadow={"lg"}
                  p={"2"}
                  border={"2px"}
                  rounded={"md"}
                >
                  <Icon name={"attribute"} size={"lg"} />
                  <Heading fontWeight={"semibold"} size={"md"}>
                    {props.attribute.name}
                  </Heading>
                </Flex>
              </Flex>
              <ModalCloseButton />
            </ModalHeader>

            <ModalBody gap={"4"}>
              <Flex mb={"4"} gap={"2"} direction={"column"}>
                <Heading size={"md"}>Description</Heading>
                {!isEditing ? (
                  description.length > 0 ? (
                    <Text>{description}</Text>
                  ) : (
                    <Warning
                      key={props.attribute.name}
                      text={"No description provided"}
                    />
                  )
                ) : (
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                )}
              </Flex>

              <Flex
                direction={"column"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"white"}
                rounded={"md"}
              >
                <Heading size={"md"}>Values</Heading>
                <Flex
                  direction={"column"}
                  gap={"2"}
                  align={"center"}
                  justify={"center"}
                >
                  {values && values.length > 0 ? (
                    <Values
                      collection={values}
                      viewOnly={!isEditing}
                      setValues={setValues}
                    />
                  ) : (
                    <Text>No values.</Text>
                  )}
                </Flex>
              </Flex>

              {isEditing && (
                <Flex direction={"row"} justify={"center"} gap={"4"}>
                  <Button
                    colorScheme={"red"}
                    variant={"outline"}
                    rightIcon={<Icon name={"check"} />}
                    onClick={() => {
                      // Reset the changes made to the Attribute
                      setDescription(defaultDescription);
                      setValues(defaultValues);

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
                    rightIcon={<Icon name={"check"} />}
                    onClick={() => {
                      // Close the modal
                      onClose();

                      // Run the 'done' action (if specified)
                      props.doneCallback
                        ? props.doneCallback({
                            _id: props.attribute._id,
                            name: props.attribute.name,
                            description: description,
                            values: values,
                          })
                        : {};
                    }}
                  >
                    Done
                  </Button>
                </Flex>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </Card>
  );
};

export default AttributeCard;
