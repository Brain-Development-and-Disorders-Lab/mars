// React
import React, { useState } from "react";

// Existing and custom components
import { Button, Flex, Input, Dialog, Text, CloseButton, EmptyState, Textarea } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import CompareAttributeDialog from "@components/CompareAttributeDialog";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Values from "@components/Values";

// Existing and custom types
import { AttributeModel, ViewAttributeDialogProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const ViewAttributeDialog = (props: ViewAttributeDialogProps) => {
  const isEditing = _.isBoolean(props.editing) ? props.editing : false;

  // State to be updated
  const [name, setName] = useState(props.attribute.name);
  const [description, setDescription] = useState(props.attribute.description);
  const [values, setValues] = useState(props.attribute.values);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareDefaultApplyAll, setCompareDefaultApplyAll] = useState(false);

  // Current working state, used to inform `CompareAttributeDialog` state
  const currentAttribute: AttributeModel = {
    ...props.attribute,
    name,
    description,
    values,
  };

  /**
   * Helper function to apply changes to the `AttributeModel` after the `CompareAttributeDialog` has been closed
   * @param updated Update `AttributeModel` after comparison
   */
  const onUpdateAttribute = (updated: AttributeModel) => {
    setName(updated.name);
    setDescription(updated.description);
    setValues(updated.values);
  };

  return (
    <React.Fragment>
      <Dialog.Root
        open={props.open}
        scrollBehavior={"inside"}
        placement={"center"}
        onOpenChange={(event) => props.setOpen(event.open)}
        size={"xl"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH={"90vh"} display={"flex"} flexDirection={"column"} p={"0"}>
            <Dialog.Header
              p={"1"}
              flexShrink={0}
              bg={"template.light"}
              color={"template.dark"}
              borderBottom={"2px"}
              roundedTop={"md"}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
                <Flex align={"center"} gap={"1"} p={"1"} border={"2px"} rounded={"md"}>
                  <Icon name={"template"} size={"xs"} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    Attribute: {props.attribute.name}
                  </Text>
                </Flex>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={() => props.setOpen(false)} colorPalette={"template"} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"0"} flex={"1"} overflow={"auto"}>
              <Flex direction={"column"} p={"2"} gap={"2"}>
                {props.isTemplate && (
                  <Flex
                    direction={"row"}
                    gap={"2"}
                    rounded={"md"}
                    bg={"surface.muted"}
                    p={"1"}
                    ml={"0.5"}
                    justify={"space-between"}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Text fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"} color={"text.muted"}>
                        Using:
                      </Text>
                      {/* Ensure actual ID is passed to Linky, remove appended Template unique identifier */}
                      <Linky
                        id={props.attribute._id.slice(0, 10)}
                        type={"templates"}
                        size={"xs"}
                        workspace={props.workspace}
                        isPublic={props.isPublic}
                      />
                    </Flex>
                    <Flex gap={"2"} align={"center"}>
                      <Button
                        size={"xs"}
                        rounded={"md"}
                        colorPalette={"blue"}
                        disabled={!isEditing}
                        onClick={() => {
                          setCompareDefaultApplyAll(false);
                          setCompareDialogOpen(true);
                        }}
                      >
                        Compare
                        <Icon name={"diff"} size={"xs"} />
                      </Button>
                      <Button
                        size={"xs"}
                        rounded={"md"}
                        colorPalette={"orange"}
                        disabled={!isEditing}
                        onClick={() => {
                          setCompareDefaultApplyAll(true);
                          setCompareDialogOpen(true);
                        }}
                      >
                        Reset
                        <Icon name={"reload"} size={"xs"} />
                      </Button>

                      <CompareAttributeDialog
                        open={compareDialogOpen}
                        setOpen={setCompareDialogOpen}
                        modifiedAttribute={currentAttribute}
                        templateAttributeId={props.attribute._id.slice(0, 10)}
                        onUpdate={onUpdateAttribute}
                        defaultApplyAll={compareDefaultApplyAll}
                        entityName={props.entityName}
                      />
                    </Flex>
                  </Flex>
                )}

                <Flex gap={"2"} rounded={"md"} direction={"row"} wrap={"wrap"}>
                  <Flex
                    direction={"column"}
                    h={"fit-content"}
                    gap={"2"}
                    w={{ base: "100%", md: "50%" }}
                    p={"1"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    rounded={"md"}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
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
                      <Text
                        fontWeight={"semibold"}
                        fontSize={"xs"}
                        color={STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Owner
                      </Text>
                      <Flex>
                        <ActorTag
                          identifier={props.attribute.owner}
                          fallback={"Unknown User"}
                          size={"sm"}
                          isPublic={props.isPublic}
                        />
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex
                    direction={"column"}
                    gap={"1"}
                    grow={"1"}
                    p={"1"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    rounded={"md"}
                  >
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      Description
                    </Text>
                    <Textarea
                      value={description}
                      size={"xs"}
                      h={"100%"}
                      onChange={(event) => setDescription(event.target.value)}
                      readOnly={!isEditing}
                    />
                  </Flex>
                </Flex>

                <Flex direction={"column"} gap={"1"} grow={"1"} h={"fit-content"} bg={"white"}>
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
                        permittedValues={props.permittedDataValues}
                      />
                    ) : (
                      <EmptyState.Root>
                        <EmptyState.Content>
                          <EmptyState.Description>No Values</EmptyState.Description>
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
                bg={"surface.muted"}
                roundedBottom={"md"}
                borderTop={"1px"}
                borderColor={"border.subtle"}
              >
                <Flex direction={"row"} justify={"space-between"} gap={"4"} w={"100%"}>
                  <Button
                    colorPalette={"red"}
                    size={"xs"}
                    rounded={"md"}
                    variant={"solid"}
                    onClick={() => {
                      // Reset the changes made to the Attribute
                      setDescription(props.attribute.description);
                      setValues(props.attribute.values);

                      // Close the dialog
                      props.setOpen(false);

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
                      // Close the dialog
                      props.setOpen(false);

                      // Run the 'done' action (if specified)
                      props.onAttributeUpdate({
                        _id: props.attribute._id,
                        name: name,
                        timestamp: props.attribute.timestamp,
                        owner: props.attribute.owner,
                        archived: false,
                        description: description,
                        values: values,
                      });
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
    </React.Fragment>
  );
};

export default ViewAttributeDialog;
