import React from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Spacer,
} from "@chakra-ui/react";

// Types
import { DialogProps } from "@types";
import Icon from "@components/Icon";

const Dialog = (props: DialogProps) => {
  const header = props.header || "Dialog";

  // Setup buttons with props or use a set of defaults
  const leftButtonColor = props.leftButtonColor || "red";
  const leftButtonLabel = props.leftButtonLabel || "Cancel";
  const leftButtonAction = () => {
    props.leftButtonAction?.();
    props.onClose();
  };

  const rightButtonColor = props.rightButtonColor || "green";
  const rightButtonLabel = props.rightButtonLabel || "Confirm";
  const rightButtonAction = () => {
    props.rightButtonAction?.();
  };

  return (
    <AlertDialog
      leastDestructiveRef={props.dialogRef}
      onClose={props.onClose}
      isOpen={props.isOpen}
      isCentered
    >
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader p={"4"}>{header}</AlertDialogHeader>
        <AlertDialogCloseButton p={"4"} />
        <AlertDialogBody px={"4"}>{props.children}</AlertDialogBody>
        <AlertDialogFooter px={"4"}>
          <Button
            size={"sm"}
            variant={"outline"}
            rightIcon={<Icon name={"cross"} />}
            colorScheme={leftButtonColor}
            ref={props.dialogRef}
            onClick={leftButtonAction}
          >
            {leftButtonLabel}
          </Button>
          <Spacer />
          <Button
            size={"sm"}
            rightIcon={<Icon name={"check"} />}
            colorScheme={rightButtonColor}
            onClick={rightButtonAction}
          >
            {rightButtonLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Dialog;
