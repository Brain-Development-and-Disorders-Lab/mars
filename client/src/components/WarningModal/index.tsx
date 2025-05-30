// React and Chakra UI imports
import React from "react";
import { Button, Flex, Text, Dialog } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { UnsavedChangesModalProps } from "@types";

const UnsavedChangesModal = (props: UnsavedChangesModalProps) => {
  return (
    <Dialog.Root open={props.blocker.state === "blocked"} placement={"center"}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header p={"2"}>
            <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"}>
              <Icon name={"warning"} />
              <Text fontWeight={"semibold"}>Unsaved Changes</Text>
            </Flex>
          </Dialog.Header>

          <Dialog.Body p={"2"}>
            <Text fontSize={"sm"}>
              Are you sure you want to leave this page? You will lose any
              unsaved changes.
            </Text>
          </Dialog.Body>

          <Dialog.Footer p={"2"}>
            <Flex w={"100%"} justify={"space-between"}>
              <Button
                size={"sm"}
                rounded={"md"}
                colorPalette={"red"}
                ref={props.cancelBlockerRef}
                onClick={() => {
                  props.blocker.reset?.();
                  props.callback();
                }}
              >
                Cancel
                <Icon name={"cross"} />
              </Button>

              <Button
                size={"sm"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={() => props.blocker.proceed?.()}
                ml={3}
              >
                Continue
                <Icon name={"check"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export { UnsavedChangesModal };
