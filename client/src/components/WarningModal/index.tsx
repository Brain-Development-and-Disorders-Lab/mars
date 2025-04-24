// React and Chakra UI imports
import React from "react";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Flex,
  Text,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { UnsavedChangesModalProps } from "@types";

const UnsavedChangesModal = (props: UnsavedChangesModalProps) => {
  return (
    <AlertDialog
      isOpen={props.blocker.state === "blocked"}
      leastDestructiveRef={props.cancelBlockerRef}
      onClose={props.onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent p={"2"}>
          <AlertDialogHeader p={"2"}>
            <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"}>
              <Icon name={"warning"} />
              <Text fontWeight={"semibold"}>Unsaved Changes</Text>
            </Flex>
          </AlertDialogHeader>

          <AlertDialogBody p={"2"}>
            <Text fontSize={"sm"}>
              Are you sure you want to leave this page? You will lose any
              unsaved changes.
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter p={"2"}>
            <Flex w={"100%"} justify={"space-between"}>
              <Button
                size={"sm"}
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
                colorPalette={"green"}
                onClick={() => props.blocker.proceed?.()}
                ml={3}
              >
                Continue
                <Icon name={"check"} />
              </Button>
            </Flex>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export { UnsavedChangesModal };
