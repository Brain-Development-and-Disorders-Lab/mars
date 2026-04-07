// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import AlertDialog from "@components/AlertDialog";

// Required UI imports
import React, { useState } from "react";
import { Button, Text } from "@chakra-ui/react";

// Define the types and metadata for the component
const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper to manage open state and trigger button
const AlertDialogWithTrigger = (props: Omit<React.ComponentProps<typeof AlertDialog>, "open" | "setOpen">) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={"sm"} colorPalette={"orange"} onClick={() => setOpen(true)}>
        Open Dialog
      </Button>
      <AlertDialog {...props} open={open} setOpen={setOpen} />
    </>
  );
};

export const Default: Story = {
  render: (args) => (
    <AlertDialogWithTrigger {...args}>
      <Text fontSize={"sm"}>Are you sure you want to proceed?</Text>
    </AlertDialogWithTrigger>
  ),
  args: {
    header: "Confirm Action",
    open: false,
    setOpen: () => {},
    children: <></>,
  },
} satisfies Story;

export const DeleteConfirmation: Story = {
  render: (args) => (
    <AlertDialogWithTrigger {...args}>
      <Text fontSize={"sm"}>This action is permanent and cannot be undone.</Text>
    </AlertDialogWithTrigger>
  ),
  args: {
    header: "Delete Item",
    open: false,
    setOpen: () => {},
    children: <></>,
    leftButtonLabel: "Cancel",
    leftButtonColor: "gray",
    rightButtonLabel: "Delete",
    rightButtonColor: "red",
  },
} satisfies Story;
