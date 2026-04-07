import React from "react";
import { Button, Dialog, Flex, Spacer, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Types
import { AlertDialogProps } from "@types";

// Variables
import { GLOBAL_STYLES } from "@variables";

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
      size={"sm"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header p={"2"} fontWeight={"semibold"} fontSize={"sm"} roundedTop={"md"} bg={"orange.300"}>
            <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
              <Icon name={"warning"} />
              <Text fontWeight={"semibold"} fontSize={"xs"}>
                {header}
              </Text>
            </Flex>
          </Dialog.Header>
          <Dialog.Body p={"2"}>{props.children}</Dialog.Body>
          <Dialog.Footer p={"1"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
            <Button
              size={"xs"}
              rounded={"md"}
              variant={"solid"}
              colorPalette={leftButtonColor}
              onClick={leftButtonAction}
            >
              {leftButtonLabel}
              <Icon name={"cross"} size={"xs"} />
            </Button>
            <Spacer />
            <Button size={"xs"} rounded={"md"} colorPalette={rightButtonColor} onClick={rightButtonAction}>
              {rightButtonLabel}
              <Icon name={"check"} size={"xs"} />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AlertDialog;
