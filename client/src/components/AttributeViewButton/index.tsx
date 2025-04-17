// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
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
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Values from "@components/Values";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { AttributeViewButtonProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

const AttributeViewButton = (props: AttributeViewButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isEditing = _.isBoolean(props.editing) ? props.editing : false;

  // State to be updated
  const [attribute] = useState(props.attribute);
  const [name, setName] = useState(props.attribute.name);
  const [description, setDescription] = useState(props.attribute.description);
  const [values, setValues] = useState(props.attribute.values);

  return (
    <Flex gap={"2"}>
      <IconButton
        aria-label={"View attribute"}
        icon={<Icon name={isEditing ? "edit" : "expand"} />}
        onClick={onOpen}
        size={"sm"}
      />
      {isEditing && (
        <IconButton
          aria-label={"Delete attribute"}
          colorScheme={"red"}
          icon={<Icon name={"delete"} />}
          onClick={props.removeCallback}
          size={"sm"}
        />
      )}

      <Modal
        onEsc={onClose}
        onClose={onClose}
        isOpen={isOpen}
        size={"4xl"}
        isCentered
        scrollBehavior={"inside"}
      >
        <ModalOverlay />

        <ModalContent>
          <ModalHeader pb={"0"} pt={"2"} px={"2"}>
            <Flex
              direction={"row"}
              justify={"space-between"}
              align={"center"}
              wrap={"wrap"}
            >
              <Flex
                align={"center"}
                gap={"2"}
                p={"2"}
                border={"2px"}
                rounded={"md"}
              >
                <Icon name={"template"} size={"sm"} />
                <Heading size={"sm"}>{props.attribute.name}</Heading>
              </Flex>
            </Flex>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody p={"0"}>
            <Flex direction={"column"} p={"2"} gap={"2"}>
              <Flex
                gap={"2"}
                p={"2"}
                rounded={"md"}
                direction={"row"}
                border={"1px"}
                borderColor={"gray.300"}
                wrap={"wrap"}
              >
                <Flex
                  direction={"column"}
                  gap={"2"}
                  w={{ base: "100%", md: "50%" }}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Name
                  </Text>
                  <Input
                    size={"sm"}
                    rounded={"md"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    isReadOnly={!isEditing}
                  />
                </Flex>

                <Flex direction={"column"} gap={"2"} grow={"1"}>
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Description
                  </Text>
                  <MDEditor
                    height={150}
                    minHeight={100}
                    maxHeight={400}
                    style={{ width: "100%" }}
                    value={description}
                    preview={isEditing ? "edit" : "preview"}
                    extraCommands={[]}
                    onChange={(value) => {
                      setDescription(value || "");
                    }}
                  />
                </Flex>
              </Flex>

              <Flex
                direction={"column"}
                gap={"2"}
                p={"2"}
                grow={"1"}
                h={"fit-content"}
                bg={"white"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <Flex
                  direction={"column"}
                  gap={"2"}
                  align={"center"}
                  justify={"center"}
                  minH={values.length > 0 ? "fit-content" : "200px"}
                >
                  {values && values.length > 0 ? (
                    <Values
                      viewOnly={!isEditing}
                      values={values}
                      setValues={setValues}
                    />
                  ) : (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No Values
                    </Text>
                  )}
                </Flex>
              </Flex>

              {isEditing && (
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  gap={"4"}
                  mt={"4"}
                >
                  <Button
                    colorScheme={"red"}
                    size={"sm"}
                    variant={"outline"}
                    rightIcon={<Icon name={"cross"} />}
                    onClick={() => {
                      // Reset the changes made to the Attribute
                      setDescription(attribute.description);
                      setValues(attribute.values);

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
                    size={"sm"}
                    rightIcon={<Icon name={"check"} />}
                    onClick={() => {
                      // Close the modal
                      onClose();

                      // Run the 'done' action (if specified)
                      props.doneCallback
                        ? props.doneCallback({
                            _id: props.attribute._id,
                            name: name,
                            timestamp: props.attribute.timestamp,
                            owner: props.attribute.owner,
                            archived: false,
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
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default AttributeViewButton;
