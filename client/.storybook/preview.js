import React from "react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";

// Import global styles
import "../src/styles/styles.scss";

// Create the theme system for Storybook
const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: { value: "#2E3192" },
        primary: { value: "#2E3192" },
        secondary: { value: "#1B98E0" },
        background: { value: "#FFFFFF" },
        "accent-1": { value: "#419D78" },
        "accent-2": { value: "#F78E69" },
      },
    },
  },
});

/** @type { import('@storybook/react-webpack5').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#1a1a1a",
        },
        {
          name: "gray",
          value: "#f7fafc",
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: {
            width: "375px",
            height: "667px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        desktop: {
          name: "Desktop",
          styles: {
            width: "1024px",
            height: "768px",
          },
        },
        large: {
          name: "Large Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story, context) => {
      // Mock Apollo Client for components that use GraphQL
      const mocks = context.parameters?.apolloClient?.mocks || [];

      return React.createElement(
        ChakraProvider,
        { value: theme },
        React.createElement(
          MockedProvider,
          { mocks, addTypename: false },
          React.createElement(
            MemoryRouter,
            { initialEntries: ["/"] },
            React.createElement(Story),
          ),
        ),
      );
    },
  ],
};

export default preview;
