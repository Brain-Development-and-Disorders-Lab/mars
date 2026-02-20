import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import Navigation from "./index";
import { WorkspaceProvider } from "@hooks/useWorkspace";
import { PostHogProvider } from "posthog-js/react";
import { Flex } from "@chakra-ui/react";

// Mock process.env.VERSION for Storybook
if (typeof process === "undefined") {
  (global as any).process = { env: { VERSION: "1.0.0" } };
} else {
  process.env.VERSION = process.env.VERSION || "1.0.0";
}

// Mock PostHog
const mockPostHog = {
  capture: () => {},
  opt_out_capturing: () => {},
  set_config: () => {},
} as any;

const meta: Meta<typeof Navigation> = {
  title: "Components/Navigation",
  component: Navigation,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) =>
      React.createElement(
        PostHogProvider,
        { client: mockPostHog },
        React.createElement(
          WorkspaceProvider,
          null,
          React.createElement(
            Flex,
            { direction: "row", w: "100%", h: "100vh", p: 0, m: 0 },
            React.createElement(
              Flex,
              {
                justify: "center",
                w: "200px",
                minW: "200px",
                h: "100%",
                position: "fixed",
                borderRight: "1px",
                borderBottom: "1px",
                borderColor: "gray.300",
                bg: "white",
                zIndex: 2,
              },
              React.createElement(Story),
            ),
            React.createElement(
              Flex,
              {
                direction: "column",
                w: "100%",
                minW: "0",
                maxW: "100%",
                ml: "200px",
                mt: "0",
                bg: "white",
                p: 8,
                overflowX: "hidden",
              },
              React.createElement(
                "div",
                { style: { fontSize: "14px", color: "#666" } },
                "Content area",
              ),
            ),
          ),
        ),
      ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
