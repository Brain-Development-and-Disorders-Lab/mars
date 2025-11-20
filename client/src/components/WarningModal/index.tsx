// React and Chakra UI imports
import React from "react";
import { Button, Flex, Text, Dialog } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { UnsavedChangesModalProps } from "@types";

const UnsavedChangesModal = (props: UnsavedChangesModalProps) => {
  return (
    <Dialog.Root
      open={props.blocker.state === "blocked"}
      placement={"center"}
      size={"xs"}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header px={"1"} py={"2"} roundedTop={"md"} bg={"orange.200"}>
            <Flex w={"100%"} direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"warning"} />
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Unsaved Changes
              </Text>
            </Flex>
          </Dialog.Header>

          <Dialog.Body p={"1"}>
            <Text fontSize={"xs"}>
              Are you sure you want to leave this page? You will lose any
              unsaved changes.
            </Text>
          </Dialog.Body>

          <Dialog.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
            <Flex w={"100%"} justify={"space-between"}>
              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"red"}
                ref={props.cancelBlockerRef}
                onClick={() => {
                  props.blocker.reset?.();
                  props.callback();
                }}
              >
                Cancel
                <Icon name={"cross"} size={"xs"} />
              </Button>

              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={() => props.blocker.proceed?.()}
                ml={3}
              >
                Continue
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export { UnsavedChangesModal };
