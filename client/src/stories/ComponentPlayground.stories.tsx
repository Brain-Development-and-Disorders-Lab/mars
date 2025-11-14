import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { VStack, Text, Box, HStack } from "@chakra-ui/react";

// Import components directly
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";
import SearchBox from "../components/SearchBox";
import Icon from "../components/Icon";

const ComponentPlayground = () => {
  return React.createElement(
    VStack,
    { gap: 4, p: 4, align: "stretch" },
    React.createElement(
      Text,
      { fontSize: "xl", fontWeight: "bold", mb: 4 },
      "Component Playground",
    ),

    // WorkspaceSwitcher Section
    React.createElement(
      Box,
      { mb: 6 },
      React.createElement(
        HStack,
        { mb: 3 },
        React.createElement(
          Text,
          { fontWeight: "semibold" },
          "WorkspaceSwitcher",
        ),
      ),
      React.createElement(
        Text,
        { fontSize: "sm", color: "gray.600", mb: 3 },
        "A dropdown component for switching between Workspaces and accessing account settings",
      ),
      React.createElement(
        Box,
        {
          border: "2px",
          borderColor: "gray.200",
          borderRadius: "lg",
          p: 4,
          bg: "white",
          minH: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(WorkspaceSwitcher),
      ),
    ),

    // SearchBox Section
    React.createElement(
      Box,
      { mb: 6 },
      React.createElement(
        HStack,
        { mb: 3 },
        React.createElement(Text, { fontWeight: "semibold" }, "SearchBox"),
      ),
      React.createElement(
        Text,
        { fontSize: "sm", color: "gray.600", mb: 3 },
        "A search input with dropdown results for searching all Entities quickly",
      ),
      React.createElement(
        Box,
        {
          border: "2px",
          borderColor: "gray.200",
          borderRadius: "lg",
          p: 4,
          bg: "white",
          minH: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(SearchBox, { resultType: "entity" }),
      ),
    ),

    // Icon Section
    React.createElement(
      Box,
      { mb: 6 },
      React.createElement(
        HStack,
        { mb: 3 },
        React.createElement(Text, { fontWeight: "semibold" }, "Icon"),
      ),
      React.createElement(
        Text,
        { fontSize: "sm", color: "gray.600", mb: 3 },
        "Icon component providing a wrapper for Bootstrap icons",
      ),
      React.createElement(
        Box,
        {
          border: "2px",
          borderColor: "gray.200",
          borderRadius: "lg",
          p: 4,
          bg: "white",
          minH: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(Icon, { name: "entity", size: "lg" }),
      ),
    ),
  );
};

const meta: Meta<typeof ComponentPlayground> = {
  title: "Playground/Component Playground",
  component: ComponentPlayground,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A playground for testing and viewing components in isolation. Use this to quickly iterate on component designs without navigating through the main application.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCustomBackground: Story = {
  parameters: {
    backgrounds: {
      default: "gray",
    },
  },
};
