// React
import React from "react";

// Existing and custom components
import { Dialog, IconButton } from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom and existing types
import { GenericDialogProps } from "@types";

const GenericDialog = (props: GenericDialogProps) => {
  const handleOpenState = (state: boolean) => {
    if (state === false) {
      props.onClose?.();
    }
  };

  return (
    <Dialog.Root
      open={props.open}
      placement={"center"}
      size={"xl"}
      scrollBehavior={"inside"}
      onOpenChange={(event) => handleOpenState(event.open)}
      onEscapeKeyDown={() => handleOpenState(false)}
      onInteractOutside={() => handleOpenState(false)}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger asChild>
            <IconButton
              bg={"white"}
              _hover={{ bg: "gray.200" }}
              variant={"subtle"}
              color={"black"}
              onClick={() => handleOpenState(false)}
            >
              <Icon name={"close"} />
            </IconButton>
          </Dialog.CloseTrigger>
          {props.children}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

const Header = (props: { header: string }) => {
  return (
    <Dialog.Header
      p={"2"}
      mt={"2"}
      ml={"1"}
      fontWeight={"semibold"}
      fontSize={"lg"}
    >
      {props.header}
    </Dialog.Header>
  );
};

const Body = (props: {
  children: React.ReactElement | React.ReactElement[];
}) => {
  return (
    <Dialog.Body px={"2"} gap={"2"}>
      {props.children}
    </Dialog.Body>
  );
};
const Footer = (props: {
  children: React.ReactElement | React.ReactElement[];
}) => {
  return <Dialog.Footer p={"2"}>{props.children}</Dialog.Footer>;
};

// Assemble the components
GenericDialog.Header = Header;
GenericDialog.Body = Body;
GenericDialog.Footer = Footer;

export default GenericDialog;
