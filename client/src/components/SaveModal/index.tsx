// React
import React from "react";

// Existing and custom components
import { Button, Dialog, Flex, Text, CloseButton } from "@chakra-ui/react";
import Icon from "@components/Icon";
import MDEditor from "@uiw/react-md-editor";

// Existing and custom types
import { SaveModalProps } from "@types";

const SaveModal = (props: SaveModalProps) => {
  const {
    open,
    onOpenChange,
    onDone,
    value,
    onChange,
    description,
    placeholder,
    showCloseButton = false,
    modifiedType,
  } = props;

  const defaultPlaceholder = modifiedType
    ? `(Optional) Enter a description of the changes made to the ${modifiedType}.`
    : "(Optional) Enter a description of the changes made.";

  const defaultDescription = modifiedType
    ? `Specify a description of the changes made to the ${modifiedType}.`
    : "Specify a description of the changes made.";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      placement={"center"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          gap={showCloseButton ? "0" : undefined}
          w={showCloseButton ? ["md", "lg", "xl"] : undefined}
        >
          <Dialog.Header
            p={"2"}
            fontWeight={"semibold"}
            fontSize={showCloseButton ? "xs" : "md"}
            bg={"blue.300"}
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
                <CloseButton
                  size={"2xs"}
                  top={"6px"}
                  onClick={() => onOpenChange({ open: false })}
                />
              </Dialog.CloseTrigger>
            )}
          </Dialog.Header>
          <Dialog.Body p={"1"}>
            <Flex direction={"column"} gap={"1"}>
              {(description !== undefined
                ? description
                : defaultDescription) && (
                <Text fontSize={"xs"} color={"gray.600"}>
                  {description !== undefined ? description : defaultDescription}
                </Text>
              )}
              <MDEditor
                height={150}
                minHeight={100}
                maxHeight={400}
                id={"saveMessageInput"}
                style={{ width: "100%" }}
                value={value}
                preview={"edit"}
                extraCommands={[]}
                textareaProps={
                  placeholder !== undefined
                    ? { placeholder: placeholder || defaultPlaceholder }
                    : undefined
                }
                onChange={(newValue) => {
                  onChange(newValue || "");
                }}
              />
            </Flex>
          </Dialog.Body>
          <Dialog.Footer
            p={"1"}
            bg={showCloseButton ? "gray.100" : undefined}
            roundedBottom={showCloseButton ? "md" : undefined}
          >
            <Flex
              direction={"row"}
              w={"100%"}
              gap={"1"}
              justify={"space-between"}
            >
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
              <Button
                variant={"solid"}
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={onDone}
              >
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

export default SaveModal;
