import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import Relationships from "./index";
import { IRelationship } from "@types";

const meta: Meta<typeof Relationships> = {
  title: "Components/Relationships",
  component: Relationships,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Relationships>;

const mockRelationships: IRelationship[] = [
  {
    type: "parent",
    source: {
      _id: "source-1",
      name: "Parent Entity One",
    },
    target: {
      _id: "target-1",
      name: "Child Entity One",
    },
  },
  {
    type: "child",
    source: {
      _id: "source-2",
      name: "Child Entity Two",
    },
    target: {
      _id: "target-2",
      name: "Parent Entity Two",
    },
  },
  {
    type: "general",
    source: {
      _id: "source-3",
      name: "Related Entity Three with a Very Long Name That Should Truncate",
    },
    target: {
      _id: "target-3",
      name: "Another Related Entity",
    },
  },
];

export const Default: Story = {
  render: (args) => {
    const [relationships, setRelationships] =
      useState<IRelationship[]>(mockRelationships);
    return React.createElement(
      Box,
      { p: 4, w: "800px" },
      React.createElement(Relationships, {
        ...args,
        relationships,
        setRelationships,
      }),
    );
  },
  args: {
    viewOnly: false,
  },
};

export const ViewOnly: Story = {
  render: (args) => {
    const [relationships] = useState<IRelationship[]>(mockRelationships);
    return React.createElement(
      Box,
      { p: 4, w: "800px" },
      React.createElement(Relationships, {
        ...args,
        relationships,
        setRelationships: () => {},
      }),
    );
  },
  args: {
    viewOnly: true,
  },
};

export const Empty: Story = {
  render: (args) => {
    const [relationships, setRelationships] = useState<IRelationship[]>([]);
    return React.createElement(
      Box,
      { p: 4, w: "800px" },
      React.createElement(Relationships, {
        ...args,
        relationships,
        setRelationships,
      }),
    );
  },
  args: {
    viewOnly: false,
  },
};
