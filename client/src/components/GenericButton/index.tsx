import React, { ReactElement } from "react";
import { Button, IconButton } from "@chakra-ui/react";

// Props for all buttons
import { GenericButtonProps } from "@types";
import Icon from "@components/Icon";

const Primary = (props: GenericButtonProps) => {
  if (props.iconOnly) {
    return (
      <IconButton
        variant={"solid"}
        colorPalette={"blue"}
        size={"sm"}
        rounded={"md"}
        loading={props.loading || false}
        disabled={props.disabled || false}
        onClick={props.onClick}
      >
        {props.icon && <Icon name={props.icon} />}
      </IconButton>
    );
  }
  return (
    <Button
      variant={"solid"}
      colorPalette={"blue"}
      size={"sm"}
      rounded={"md"}
      loading={props.loading || false}
      disabled={props.disabled || false}
      onClick={props.onClick}
    >
      {props.label}
      {props.icon && <Icon name={props.icon} />}
    </Button>
  );
};

const Action = (props: GenericButtonProps) => {
  if (props.iconOnly) {
    return (
      <IconButton
        variant={"solid"}
        colorPalette={"green"}
        size={"sm"}
        rounded={"md"}
        loading={props.loading || false}
        disabled={props.disabled || false}
        onClick={props.onClick}
      >
        {props.icon && <Icon name={props.icon} />}
      </IconButton>
    );
  }
  return (
    <Button
      variant={"solid"}
      colorPalette={"green"}
      size={"sm"}
      rounded={"md"}
      loading={props.loading || false}
      disabled={props.disabled || false}
      onClick={props.onClick}
    >
      {props.label}
      {props.icon && <Icon name={props.icon} />}
    </Button>
  );
};

const Cancel = (props: GenericButtonProps) => {
  if (props.iconOnly) {
    return (
      <IconButton
        variant={"outline"}
        colorPalette={"red"}
        size={"sm"}
        rounded={"md"}
        loading={props.loading || false}
        disabled={props.disabled || false}
        onClick={props.onClick}
      >
        {props.icon && <Icon name={props.icon} />}
      </IconButton>
    );
  }
  return (
    <Button
      variant={"outline"}
      colorPalette={"red"}
      size={"sm"}
      rounded={"md"}
      loading={props.loading || false}
      disabled={props.disabled || false}
      onClick={props.onClick}
    >
      {props.label}
      {props.icon && <Icon name={props.icon} />}
    </Button>
  );
};

const Back = (props: GenericButtonProps) => {
  if (props.iconOnly) {
    return (
      <IconButton
        variant={"solid"}
        colorPalette={"orange"}
        size={"sm"}
        rounded={"md"}
        loading={props.loading || false}
        disabled={props.disabled || false}
        onClick={props.onClick}
      >
        {props.icon && <Icon name={props.icon} />}
      </IconButton>
    );
  }
  return (
    <Button
      variant={"solid"}
      colorPalette={"orange"}
      size={"sm"}
      rounded={"md"}
      loading={props.loading || false}
      disabled={props.disabled || false}
      onClick={props.onClick}
    >
      {props.label}
      {props.icon && <Icon name={props.icon} />}
    </Button>
  );
};

const GenericButton = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}) => <>{children}</>;
GenericButton.Back = Back;
GenericButton.Cancel = Cancel;
GenericButton.Action = Action;
GenericButton.Primary = Primary;

// Exporting all buttons
export default GenericButton;
