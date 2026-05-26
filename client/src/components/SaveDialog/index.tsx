// React
import React from "react";

// Existing and custom components
import { Button, Dialog, Flex, Text, CloseButton } from "@chakra-ui/react";
import Icon from "@components/Icon";
import RichTextEditor from "@components/RichTextEditor";

// Existing and custom types
import { SaveDialogProps } from "@types";

// Variables
import { GLOBAL_STYLES } from "@variables";

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
            bg={GLOBAL_STYLES.dialog.header.bg}
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
              {(description !== undefined ? description : defaultDescription) && (
                <Text fontSize={"xs"} color={GLOBAL_STYLES.font.secondaryHeader.color}>
                  {description !== undefined ? description : defaultDescription}
                </Text>
              )}
              <RichTextEditor id={"saveMessageInput"} value={value} onChange={(newValue) => onChange(newValue)} />
            </Flex>
          </Dialog.Body>

          <Dialog.Footer p={"2"} bg={GLOBAL_STYLES.dialog.footer.bg} roundedBottom={"md"}>
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
