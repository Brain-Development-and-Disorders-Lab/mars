import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Icon from "./index";

// Import the icon names and types
import { SYSTEM_ICONS } from "./index";
import { IconNames } from "@types";

// Extract the set of icon names
const IconSet: IconNames[] = Object.keys(SYSTEM_ICONS) as IconNames[];

const meta: Meta<typeof Icon> = {
  title: "Components/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A comprehensive icon component that provides access to various Bootstrap icons used throughout the application.",
      },
    },
  },
  argTypes: {
    name: {
      control: "select",
      options: IconSet,
      description: "Name of the icon to display",
    },
    color: {
      control: "color",
      description: "Color of the icon",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the icon",
    },
  },
  args: {
    name: "entity",
    color: "currentColor",
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "entity",
  },
};

export const WithColor: Story = {
  args: {
    name: "entity",
    color: "red",
  },
};

export const DifferentSizes: Story = {
  render: (args) =>
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "16px" } },
      React.createElement(Icon, { ...args, size: "sm" }),
      React.createElement(Icon, { ...args, size: "md" }),
      React.createElement(Icon, { ...args, size: "lg" }),
    ),
  args: {
    name: "workspace",
  },
};

export const IconGallery: Story = {
  render: () =>
    React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "16px",
          padding: "20px",
          maxHeight: "400px",
          overflowY: "auto",
        },
      },
      ...IconSet.map((icon: IconNames) =>
        React.createElement(
          "div",
          {
            key: icon,
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "8px",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              fontSize: "12px",
            },
          },
          React.createElement(Icon, { name: icon, size: "lg" }),
          React.createElement(
            "span",
            {
              style: {
                marginTop: "4px",
                textAlign: "center",
                wordBreak: "break-word",
              },
            },
            icon,
          ),
        ),
      ),
    ),
  parameters: {
    docs: {
      description: {
        story:
          "A gallery showing the first 50 available icons. Scroll to see more icons.",
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    name: "settings",
    color: "blue",
    size: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "Use the controls below to interact with the icon properties.",
      },
    },
  },
};
