import React from "react";
import { Button, Dialog, Spacer } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Types
import { AlertDialogProps } from "@types";

const AlertDialog = (props: AlertDialogProps) => {
  const header = props.header || "Alert";

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
    <Dialog.Root
      leastDestructiveRef={props.dialogRef}
      onClose={props.onClose}
      isOpen={props.open}
      isCentered
    >
      <Dialog.Trigger />
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header p={"4"}>{header}</Dialog.Header>
          <Dialog.Body px={"4"}>{props.children}</Dialog.Body>
          <Dialog.Footer px={"4"}>
            <Button
              size={"sm"}
              variant={"outline"}
              colorPalette={leftButtonColor}
              ref={props.dialogRef}
              onClick={leftButtonAction}
            >
              {leftButtonLabel}
              <Icon name={"cross"} />
            </Button>
            <Spacer />
            <Button
              size={"sm"}
              colorPalette={rightButtonColor}
              onClick={rightButtonAction}
            >
              {rightButtonLabel}
              <Icon name={"check"} />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AlertDialog;
