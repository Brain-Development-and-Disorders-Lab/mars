import React from "react";
import { Button, Dialog, Flex, Spacer } from "@chakra-ui/react";
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
            px={"2"}
            py={"4"}
            fontWeight={"semibold"}
            fontSize={"md"}
            roundedTop={"md"}
            bg={"gray.100"}
          >
            <Flex direction={"row"} align={"center"} gap={"2"}>
              <Icon name={"warning"} />
              {header}
            </Flex>
          </Dialog.Header>
          <Dialog.Body p={"2"}>{props.children}</Dialog.Body>
          <Dialog.Footer p={"2"} bg={"gray.100"} roundedBottom={"md"}>
            <Button
              size={"sm"}
              rounded={"md"}
              variant={"solid"}
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
