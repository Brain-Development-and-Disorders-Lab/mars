// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  IconButton,
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
import Icon from "@components/Icon";
import Values from "@components/Values";

// Existing and custom types
import { AttributeViewButtonProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

const AttributeViewButton = (props: AttributeViewButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isEditing = _.isBoolean(props.editing) ? props.editing : false;

  // State to be updated
  const [description, setDescription] = useState(props.attribute.description);
  const [values, setValues] = useState(props.attribute.values);

  // State to store original values
  const [defaultDescription, _setDefaultDescription] = useState(
    props.attribute.description,
  );
  const [defaultValues, _setDefaultValues] = useState(props.attribute.values);

  return (
    <Flex gap={"2"}>
      <IconButton
        aria-label={"View attribute"}
        icon={<Icon name={isEditing ? "edit" : "view"} />}
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
                gap={"4"}
                p={"2"}
                border={"2px"}
                rounded={"md"}
              >
                <Icon name={"attribute"} size={"md"} />
                <Heading size={"sm"}>{props.attribute.name}</Heading>
              </Flex>
            </Flex>
            <ModalCloseButton />
          </ModalHeader>

          <ModalBody p={"2"} gap={"2"}>
            <Flex
              mb={"4"}
              gap={"2"}
              p={"2"}
              rounded={"md"}
              direction={"column"}
              bg={"gray.50"}
            >
              <Text size={"md"} fontWeight={"semibold"}>
                Description
              </Text>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                isReadOnly={!isEditing}
              />
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
              borderColor={"gray.200"}
            >
              <Heading size={"md"}>Values</Heading>
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
                  size={"sm"}
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
    </Flex>
  );
};

export default AttributeViewButton;
