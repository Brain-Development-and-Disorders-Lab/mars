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
  };

  const rightButtonColor = props.rightButtonColor || "green";
  const rightButtonLabel = props.rightButtonLabel || "Confirm";
  const rightButtonAction = () => {
    props.rightButtonAction?.();
  };

  return (
    <Dialog.Root
      open={props.open}
      onOpenChange={(details) => props.setOpen(details.open)}
      placement={"center"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header
            p={"2"}
            mt={"2"}
            fontWeight={"semibold"}
            fontSize={"md"}
          >
            {header}
          </Dialog.Header>
          <Dialog.Body p={"2"}>{props.children}</Dialog.Body>
          <Dialog.Footer p={"2"}>
            <Button
              size={"sm"}
              rounded={"md"}
              variant={"outline"}
              colorPalette={leftButtonColor}
              onClick={leftButtonAction}
            >
              {leftButtonLabel}
              <Icon name={"cross"} />
            </Button>
            <Spacer />
            <Button
              size={"sm"}
              rounded={"md"}
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
