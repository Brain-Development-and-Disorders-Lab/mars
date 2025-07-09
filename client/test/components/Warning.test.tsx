import React from "react";

// Test imports
import { render, screen } from "@testing-library/react";
import { expect } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Component
import { Warning } from "../../src/components/Label";

describe("Warning Component", () => {
  it("renders with provided text", () => {
    const testText = "Test Warning Message";
    const { container } = render(
      <ChakraProvider value={theme}>
        <Warning text={testText} />
      </ChakraProvider>,
    );

    expect(screen.getByText(testText)).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
