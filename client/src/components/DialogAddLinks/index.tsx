// React imports
import React, { useState } from "react";

// Existing and custom components
import { Button, CloseButton, Dialog, Flex, Input, Portal, Spacer, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SelectSearch from "@components/SelectSearch";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom types
import { IGenericItem, ILink, DialogAddLinksProps, LinkType } from "@types";

// Utility imports
import _ from "lodash";

// Variables
import { STYLES } from "@variables";
import { LINK_TYPE_ARROW_COLOR, LINK_TYPE_ARROW_ICON, LINK_TYPE_PALETTE } from "@components/Links";

const DialogAddLinks = ({ open, onClose, sourceId, sourceName, existingLinks, onAdd }: DialogAddLinksProps) => {
  const [staged, setStaged] = useState<ILink[]>([]);
  const [selectedType, setSelectedType] = useState<LinkType>("general");
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

  const stageLink = () => {
    if (_.isUndefined(selectedTarget._id)) return;

    // Filter and handle insular links
    if (sourceId && selectedTarget._id === sourceId) {
      toaster.create({
        title: "Invalid Link",
        description: "Cannot add a link to itself",
        type: "warning",
        duration: 2000,
        closable: true,
      });
      return;
    }
    const candidate: ILink = {
      source: { _id: sourceId || "", name: sourceName },
      target: { _id: selectedTarget._id, name: selectedTarget.name },
      type: selectedType,
    };

    // Filter and handle duplicate links
    const isDuplicate = [...existingLinks, ...staged].some(
      (r) =>
        r.source._id === candidate.source._id && r.target._id === candidate.target._id && r.type === candidate.type,
    );
    if (isDuplicate) {
      toaster.create({
        title: "Invalid Link",
        description: "This link already exists",
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
      size={"xl"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content w={["xl", "2xl"]}>
            <Dialog.Header p={"2"} bg={"entity.light"} color={"entity.dark"} roundedTop={"md"}>
              <Flex direction={"row"} gap={"0.5"} align={"center"} ml={"0.5"}>
                <Icon name={"graph"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Links
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={handleClose} colorPalette={"entity"} />
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
                  bg={STYLES.card.bg}
                  border={STYLES.border.style}
                  borderColor={STYLES.border.color}
                >
                  <Flex direction={"column"} gap={"1"} flex={"1"} minW={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Source
                    </Text>
                    <Input size={"xs"} rounded={"md"} value={sourceName} readOnly disabled bg={"white"} />
                  </Flex>
                  <Icon
                    name={LINK_TYPE_ARROW_ICON[selectedType]}
                    size={"sm"}
                    color={LINK_TYPE_ARROW_COLOR[selectedType]}
                  />
                  <Flex direction={"column"} gap={"1"} flex={"1"} minW={0}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      Target
                    </Text>
                    <SelectSearch resultType={"entity"} value={selectedTarget} onChange={setSelectedTarget} />
                  </Flex>
                </Flex>

                {/* Type selector and stage button */}
                <Flex direction={"column"} p={"1"} gap={"2"} w={"100%"}>
                  <Flex direction={"row"} align={"center"} gap={"2"}>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={STYLES.font.secondaryHeader.color}
                      flexShrink={0}
                    >
                      Link Type
                    </Text>
                    <Flex gap={"1"}>
                      {(["general", "parent", "child"] as LinkType[]).map((type) => (
                        <Button
                          key={type}
                          size={"xs"}
                          rounded={"md"}
                          variant={selectedType === type ? "solid" : "outline"}
                          colorPalette={selectedType === type ? LINK_TYPE_PALETTE[type] : "gray"}
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
                      onClick={stageLink}
                      flexShrink={0}
                    >
                      Create Link
                      <Icon name={"add"} size={"xs"} />
                    </Button>
                  </Flex>

                  <Flex direction={"row"} align={"center"} gap={"1"}>
                    <Text
                      fontSize={"xs"}
                      fontWeight={"semibold"}
                      color={STYLES.font.secondaryHeader.color}
                      flexShrink={0}
                    >
                      Link Description
                    </Text>
                    {selectedType === "general" && (
                      <Flex gap={"1"} align={"center"}>
                        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} flexShrink={0}>
                          {sourceName} is related to
                        </Text>
                        {selectedTarget._id ? (
                          <Linky id={selectedTarget._id} type={"entities"} />
                        ) : (
                          <Text
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            color={STYLES.font.secondaryHeader.color}
                            flexShrink={0}
                          >
                            Select Entity
                          </Text>
                        )}
                      </Flex>
                    )}
                    {selectedType === "parent" && (
                      <Flex gap={"1"} align={"center"}>
                        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} flexShrink={0}>
                          {sourceName} is the parent of
                        </Text>
                        {selectedTarget._id ? (
                          <Linky id={selectedTarget._id} type={"entities"} />
                        ) : (
                          <Text
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            color={STYLES.font.secondaryHeader.color}
                            flexShrink={0}
                          >
                            Select Entity
                          </Text>
                        )}
                      </Flex>
                    )}
                    {selectedType === "child" && (
                      <Flex gap={"1"} align={"center"}>
                        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} flexShrink={0}>
                          {sourceName} is the child of
                        </Text>
                        {selectedTarget._id ? (
                          <Linky id={selectedTarget._id} type={"entities"} />
                        ) : (
                          <Text
                            fontSize={"xs"}
                            fontWeight={"semibold"}
                            color={STYLES.font.secondaryHeader.color}
                            flexShrink={0}
                          >
                            Select Entity
                          </Text>
                        )}
                      </Flex>
                    )}
                  </Flex>
                </Flex>

                {/* Staged links list */}
                <Flex
                  direction={"column"}
                  rounded={"md"}
                  border={STYLES.border.style}
                  borderColor={STYLES.border.color}
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
                        borderColor={"border.subtle"}
                        bg={"white"}
                      >
                        <Tooltip content={rel.source.name} disabled={rel.source.name.length < 18} showArrow>
                          <Text fontSize={"xs"} fontWeight={"semibold"} flexShrink={0} maxW={"120px"} truncate>
                            {_.truncate(rel.source.name, { length: 18 })}
                          </Text>
                        </Tooltip>
                        <Icon
                          name={LINK_TYPE_ARROW_ICON[rel.type]}
                          size={"xs"}
                          color={LINK_TYPE_ARROW_COLOR[rel.type]}
                        />
                        <Flex flex={"1"} minW={0}>
                          <Linky id={rel.target._id} type={"entities"} truncate={18} />
                        </Flex>
                        <Tag.Root size={"sm"} colorPalette={LINK_TYPE_PALETTE[rel.type]} flexShrink={0}>
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
                    <Flex
                      direction={"column"}
                      gap={"3"}
                      align={"center"}
                      justify={"center"}
                      p={"4"}
                      grow={"1"}
                      minH={"240px"}
                    >
                      <Icon name={"graph"} size={"md"} color={"gray.300"} />
                      <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
                        No Links
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Dialog.Body>

            <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
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
                  Add {staged.length} {staged.length === 1 ? "Link" : "Links"}
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

export default DialogAddLinks;
