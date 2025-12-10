// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Input,
  Dialog,
  Text,
  CloseButton,
  EmptyState,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
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
    <Flex gap={"1"}>
      <Button
        size="2xs"
        variant="subtle"
        rounded="md"
        colorPalette="gray"
        aria-label={"View Attribute"}
        onClick={() => setOpen(true)}
      >
        {isEditing ? "Edit" : "Expand"}
        <Icon name={isEditing ? "edit" : "expand"} size={"xs"} />
      </Button>
      {isEditing && (
        <Button
          size="2xs"
          rounded="md"
          variant="subtle"
          colorPalette="red"
          aria-label={"Delete Attribute"}
          onClick={props.removeCallback}
        >
          Delete
          <Icon name={"delete"} size={"xs"} />
        </Button>
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
            p={"0"}
          >
            <Dialog.Header
              p={"1"}
              flexShrink={0}
              bg={"blue.300"}
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
                  gap={"1"}
                  p={"1"}
                  border={"2px"}
                  rounded={"md"}
                >
                  <Icon name={"template"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    {props.attribute.name}
                  </Text>
                </Flex>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"2xs"}
                  top={"6px"}
                  onClick={() => setOpen(false)}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"0"} flex={"1"} overflow={"auto"}>
              <Flex direction={"column"} p={"1"} gap={"1"}>
                <Flex gap={"1"} rounded={"md"} direction={"row"} wrap={"wrap"}>
                  <Flex
                    direction={"column"}
                    h={"fit-content"}
                    gap={"1"}
                    w={{ base: "100%", md: "50%" }}
                    p={"1"}
                    border={"1px solid"}
                    borderColor={"gray.300"}
                    rounded={"md"}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Name
                    </Text>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      readOnly={!isEditing}
                    />
                    <Flex direction={"column"} gap={"1"}>
                      <Text fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"}>
                        Owner
                      </Text>
                      <Flex>
                        <ActorTag
                          orcid={props.attribute.owner}
                          fallback={"Unknown User"}
                          size={"sm"}
                        />
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex
                    direction={"column"}
                    gap={"1"}
                    grow={"1"}
                    p={"1"}
                    border={"1px solid"}
                    borderColor={"gray.300"}
                    rounded={"md"}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
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
                  gap={"1"}
                  grow={"1"}
                  h={"fit-content"}
                  bg={"white"}
                >
                  <Flex
                    direction={"column"}
                    gap={"1"}
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
                p={"1"}
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
                    size={"xs"}
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
                    <Icon name={"cross"} size={"xs"} />
                  </Button>

                  <Button
                    colorPalette={"green"}
                    size={"xs"}
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
                    <Icon name={"check"} size={"xs"} />
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
