// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  IconButton,
  Input,
  Dialog,
  Text,
  CloseButton,
  EmptyState,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Values from "@components/Values";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { AttributeViewButtonProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

const AttributeViewButton = (props: AttributeViewButtonProps) => {
  const [open, setOpen] = useState(false);
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
        onClick={() => setOpen(true)}
        variant={"subtle"}
        size={"sm"}
        rounded={"md"}
      >
        <Icon name={isEditing ? "edit" : "expand"} />
      </IconButton>
      {isEditing && (
        <IconButton
          aria-label={"Delete attribute"}
          colorPalette={"red"}
          onClick={props.removeCallback}
          size={"sm"}
          rounded={"md"}
        >
          <Icon name={"delete"} />
        </IconButton>
      )}
      <Dialog.Root
        open={open}
        scrollBehavior={"inside"}
        placement={"center"}
        onOpenChange={(event) => setOpen(event.open)}
        size={"xl"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxH={"90vh"}
            display={"flex"}
            flexDirection={"column"}
          >
            <Dialog.Header
              p={"2"}
              flexShrink={0}
              bg={"gray.100"}
              borderBottom={"2px"}
              roundedTop={"md"}
            >
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
                  <Icon name={"template"} />
                  <Text fontSize={"md"} fontWeight={"semibold"}>
                    {props.attribute.name}
                  </Text>
                </Flex>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"sm"}
                  onClick={() => setOpen(false)}
                  _hover={{ bg: "gray.300" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"0"} flex={"1"} overflow={"auto"}>
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
                      readOnly={!isEditing}
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
                      <EmptyState.Root>
                        <EmptyState.Content>
                          <EmptyState.Description>
                            No Values
                          </EmptyState.Description>
                        </EmptyState.Content>
                      </EmptyState.Root>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Dialog.Body>

            {isEditing && (
              <Dialog.Footer
                p={"2"}
                flexShrink={0}
                bg={"gray.100"}
                roundedBottom={"md"}
                borderTop={"1px"}
                borderColor={"gray.200"}
              >
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  gap={"4"}
                  w={"100%"}
                >
                  <Button
                    colorPalette={"red"}
                    size={"sm"}
                    rounded={"md"}
                    variant={"solid"}
                    onClick={() => {
                      // Reset the changes made to the Attribute
                      setDescription(attribute.description);
                      setValues(attribute.values);

                      // Close the modal
                      setOpen(false);

                      // Run the 'cancel' action (if specified)
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                      props.cancelCallback ? props.cancelCallback() : {};
                    }}
                  >
                    Cancel
                    <Icon name={"cross"} />
                  </Button>

                  <Button
                    colorPalette={"green"}
                    size={"sm"}
                    rounded={"md"}
                    onClick={() => {
                      // Close the modal
                      setOpen(false);

                      // Run the 'done' action (if specified)
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
                    <Icon name={"check"} />
                  </Button>
                </Flex>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default AttributeViewButton;
