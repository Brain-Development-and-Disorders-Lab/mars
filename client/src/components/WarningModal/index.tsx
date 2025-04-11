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
                colorScheme={"red"}
                rightIcon={<Icon name={"cross"} />}
                ref={props.cancelBlockerRef}
                onClick={() => {
                  props.blocker.reset?.();
                  props.callback();
                }}
              >
                Cancel
              </Button>

              <Button
                size={"sm"}
                rightIcon={<Icon name={"check"} />}
                colorScheme={"green"}
                onClick={() => props.blocker.proceed?.()}
                ml={3}
              >
                Continue
              </Button>
            </Flex>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export { UnsavedChangesModal };
