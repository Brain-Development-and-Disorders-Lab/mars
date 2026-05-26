// React imports
import React, { useState } from "react";

// Existing and custom components
import { Button, CloseButton, Dialog, Flex, Input, Portal, Spacer, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom types
import { IGenericItem, IRelationship, AddRelationshipDialogProps, RelationshipType } from "@types";

// Utility imports
import _ from "lodash";

// Variables
import { GLOBAL_STYLES } from "@variables";
import {
  RELATIONSHIP_TYPE_ARROW_COLOR,
  RELATIONSHIP_TYPE_ARROW_ICON,
  RELATIONSHIP_TYPE_PALETTE,
} from "@components/Relationships";

const AddRelationshipDialog = ({
  open,
  onClose,
  sourceId,
  sourceName,
  existingRelationships,
  onAdd,
}: AddRelationshipDialogProps) => {
  const [staged, setStaged] = useState<IRelationship[]>([]);
  const [selectedType, setSelectedType] = useState<RelationshipType>("general");
  const [selectedTarget, setSelectedTarget] = useState<IGenericItem>({} as IGenericItem);

  const reset = () => {
    setStaged([]);
    setSelectedType("general");
    setSelectedTarget({} as IGenericItem);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const stageRelationship = () => {
    if (_.isUndefined(selectedTarget._id)) return;

    // Filter and handle insular relationships
    if (sourceId && selectedTarget._id === sourceId) {
      toaster.create({
        title: "Invalid Relationship",
        description: "Cannot add a relationship to itself",
        type: "warning",
        duration: 2000,
        closable: true,
      });
      return;
    }
    const candidate: IRelationship = {
      source: { _id: sourceId || "", name: sourceName },
      target: { _id: selectedTarget._id, name: selectedTarget.name },
      type: selectedType,
    };

    // Filter and handle duplicate relationships
    const isDuplicate = [...existingRelationships, ...staged].some(
      (r) =>
        r.source._id === candidate.source._id && r.target._id === candidate.target._id && r.type === candidate.type,
    );
    if (isDuplicate) {
      toaster.create({
        title: "Invalid Relationship",
        description: "This relationship already exists",
        type: "warning",
        duration: 2000,
        closable: true,
      });
      return;
    }

    setStaged([...staged, candidate]);
    setSelectedType("general");
    setSelectedTarget({} as IGenericItem);
  };

  const confirm = () => {
    onAdd(staged);
    reset();
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => {
        if (!event.open) handleClose();
      }}
      placement={"center"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w={["lg", "xl", "2xl"]}>
            <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
              <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                <Icon name={"graph"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Relationships
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={handleClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={"2"} gap={"2"}>
              <Flex direction={"column"} gap={"2"}>
                {/* Source and target */}
                <Flex
                  direction={"row"}
                  gap={"2"}
                  align={"center"}
                  p={"2"}
                  rounded={"md"}
                  bg={GLOBAL_STYLES.card.bg}
                  border={GLOBAL_STYLES.border.style}
                  borderColor={GLOBAL_STYLES.border.color}
                >
                  <Flex direction={"column"} gap={"1"} flex={"1"} minW={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                      Source
                    </Text>
                    <Input size={"xs"} rounded={"md"} value={sourceName} readOnly disabled bg={"white"} />
                  </Flex>
                  <Icon
                    name={RELATIONSHIP_TYPE_ARROW_ICON[selectedType]}
                    size={"sm"}
                    color={RELATIONSHIP_TYPE_ARROW_COLOR[selectedType]}
                  />
                  <Flex direction={"column"} gap={"1"} flex={"1"} minW={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                      Target
                    </Text>
                    <SearchSelect resultType={"entity"} value={selectedTarget} onChange={setSelectedTarget} />
                  </Flex>
                </Flex>

                {/* Type selector and stage button */}
                <Flex direction={"row"} align={"center"} gap={"2"} p={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"} flexShrink={0}>
                    Type
                  </Text>
                  <Flex gap={"1"}>
                    {(["general", "parent", "child"] as RelationshipType[]).map((type) => (
                      <Button
                        key={type}
                        size={"xs"}
                        rounded={"md"}
                        variant={selectedType === type ? "solid" : "outline"}
                        colorPalette={selectedType === type ? RELATIONSHIP_TYPE_PALETTE[type] : "gray"}
                        bg={selectedType === type ? undefined : "white"}
                        color={selectedType === type ? undefined : "black"}
                        onClick={() => setSelectedType(type)}
                      >
                        {_.capitalize(type)}
                      </Button>
                    ))}
                  </Flex>
                  <Spacer />
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"green"}
                    disabled={_.isUndefined(selectedTarget._id)}
                    onClick={stageRelationship}
                    flexShrink={0}
                  >
                    Create
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>

                {/* Staged relationships list */}
                <Flex
                  direction={"column"}
                  rounded={"md"}
                  border={GLOBAL_STYLES.border.style}
                  borderColor={GLOBAL_STYLES.border.color}
                  overflow={"hidden"}
                >
                  {staged.length > 0 ? (
                    staged.map((rel, index) => (
                      <Flex
                        key={`staged-${index}`}
                        direction={"row"}
                        align={"center"}
                        gap={"2"}
                        px={"2"}
                        py={"1.5"}
                        borderBottom={index < staged.length - 1 ? "1px solid" : "none"}
                        borderColor={"gray.200"}
                        bg={"white"}
                      >
                        <Tooltip content={rel.source.name} disabled={rel.source.name.length < 24} showArrow>
                          <Text fontSize={"xs"} fontWeight={"semibold"} flexShrink={0} maxW={"120px"} truncate>
                            {_.truncate(rel.source.name, { length: 24 })}
                          </Text>
                        </Tooltip>
                        <Icon
                          name={RELATIONSHIP_TYPE_ARROW_ICON[rel.type]}
                          size={"xs"}
                          color={RELATIONSHIP_TYPE_ARROW_COLOR[rel.type]}
                        />
                        <Flex flex={"1"} minW={0}>
                          <Linky id={rel.target._id} type={"entities"} />
                        </Flex>
                        <Tag.Root size={"sm"} colorPalette={RELATIONSHIP_TYPE_PALETTE[rel.type]} flexShrink={0}>
                          <Tag.Label fontSize={"xs"}>{_.capitalize(rel.type)}</Tag.Label>
                        </Tag.Root>
                        <Button
                          size={"2xs"}
                          variant={"subtle"}
                          colorPalette={"red"}
                          flexShrink={0}
                          onClick={() => setStaged(staged.filter((_, i) => i !== index))}
                        >
                          Remove
                          <Icon name={"delete"} size={"xs"} />
                        </Button>
                      </Flex>
                    ))
                  ) : (
                    <Flex direction={"column"} gap={"3"} align={"center"} justify={"center"} p={"4"} grow={"1"}>
                      <Icon name={"graph"} size={"md"} color={"gray.300"} />
                      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
                        No Relationships
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Dialog.Body>

            <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
              <Flex direction={"row"} justify={"space-between"} w={"100%"}>
                <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"red"} onClick={handleClose}>
                  Cancel
                  <Icon name={"cross"} size={"xs"} />
                </Button>
                <Button
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={confirm}
                  disabled={staged.length === 0}
                >
                  Add {staged.length} {staged.length === 1 ? "Relationship" : "Relationships"}
                  <Icon name={"add"} size={"xs"} />
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddRelationshipDialog;
