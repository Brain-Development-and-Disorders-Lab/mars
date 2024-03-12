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
    props.attribute.description
  );
  const [defaultValues, _setDefaultValues] = useState(props.attribute.values);

  return (
    <Flex gap={"2"}>
      <IconButton
        aria-label={"View attribute"}
        icon={<Icon name={isEditing ? "edit" : "view"} />}
        onClick={onOpen}
      />
      {isEditing && (
        <IconButton
          aria-label={"Delete attribute"}
          colorScheme={"red"}
          icon={<Icon name={"delete"} />}
          onClick={props.removeCallback}
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

        <ModalContent p={"2"} gap={"4"}>
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
            <Flex
              mb={"4"}
              gap={"2"}
              p={"4"}
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
              gap={"4"}
              p={"4"}
              grow={"1"}
              h={"fit-content"}
              bg={"white"}
              rounded={"md"}
              border={"2px"}
              borderColor={"gray.200"}
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
                    viewOnly={!isEditing}
                    values={values}
                    setValues={setValues}
                  />
                ) : (
                  <Text>No values.</Text>
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
