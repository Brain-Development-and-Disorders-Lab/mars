// React
import React from "react";

// Existing and custom components
import { Button, Dialog, Flex, Text, CloseButton, Textarea } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { SaveDialogProps } from "@types";

// Variables
import { STYLES } from "@variables";
import { Warning } from "@components/Label";

const SaveDialog = (props: SaveDialogProps) => {
  const { open, onOpenChange, onDone, value, onChange, description, showCloseButton = false, modifiedType } = props;

  const defaultDescription = modifiedType
    ? `Specify a description of the changes made to the ${modifiedType}.`
    : "Specify a description of the changes made.";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} placement={"center"} closeOnEscape closeOnInteractOutside>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content gap={showCloseButton ? "0" : undefined} w={showCloseButton ? ["md", "lg", "xl"] : undefined}>
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            fontSize={showCloseButton ? "xs" : "md"}
            bg={"surface.emphasized"}
            color={"text.default"}
            roundedTop={"md"}
          >
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"save"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Saving Changes
              </Text>
            </Flex>
            {showCloseButton && (
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={() => onOpenChange({ open: false })} />
              </Dialog.CloseTrigger>
            )}
          </Dialog.Header>

          <Dialog.Body p={"2"}>
            <Flex direction={"column"} gap={"2"}>
              {props.isPublic && <Warning text={"This Workspace is public, all changes will be instantly visible."} />}
              {(description !== undefined ? description : defaultDescription) && (
                <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                  {description !== undefined ? description : defaultDescription}
                </Text>
              )}
              <Textarea
                id={"saveMessageInput"}
                placeholder={"Describe any changes made..."}
                value={value}
                size={"xs"}
                h={"100%"}
                minH={"120px"}
                onChange={(event) => onChange(event.target.value)}
              />
            </Flex>
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} gap={"2"} justify={"space-between"}>
              <Button
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"red"}
                onClick={() => onOpenChange({ open: false })}
              >
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>
              <Button variant={"solid"} size={"xs"} rounded={"md"} colorPalette={"green"} onClick={onDone}>
                Done
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default SaveDialog;
