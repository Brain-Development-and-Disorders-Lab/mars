import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import WorkspaceSwitcher from "./index";

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: "Components/WorkspaceSwitcher",
  component: WorkspaceSwitcher,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    id: {
      control: "text",
    },
  },
  args: {},
  decorators: [
    (Story) =>
      React.createElement(
        "div",
        { style: { width: "300px", height: "60px" } },
        React.createElement(Story),
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
