import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import SearchBox from "./index";

const meta: Meta<typeof SearchBox> = {
  title: "Components/SearchBox",
  component: SearchBox,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    resultType: {
      control: "select",
      options: ["entity"],
      description: "Type of results to search for",
    },
  },
  args: {
    resultType: "entity",
  },
  decorators: [
    (Story) =>
      React.createElement(
        "div",
        { style: { width: "400px" } },
        React.createElement(Story),
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    resultType: "entity",
  },
};
