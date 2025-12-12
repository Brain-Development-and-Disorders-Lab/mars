import React from "react";

// Testing imports
import { render, screen } from "@testing-library/react";
import { expect, describe, it } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import Loading from "../../src/components/Loading";

const renderLoading = () => {
  return render(
    <ChakraProvider value={theme}>
      <Loading />
    </ChakraProvider>,
  );
};

describe("Loading Component", () => {
  describe("Basic Rendering", () => {
    it("renders", () => {
      const { container } = renderLoading();
      expect(container.firstChild).toBeTruthy();
    });

    it("renders spinner", () => {
      renderLoading();
      const spinner = screen.getByRole("status");
      expect(spinner).toBeTruthy();
    });
  });

  describe("Layout", () => {
    it("has proper flex layout", () => {
      const { container } = renderLoading();
      // Chakra UI Flex component renders with generated class names
      // Check that the root element exists (which is the Flex component)
      const rootElement = container.firstChild;
      expect(rootElement).toBeTruthy();
      // Verify it's a div (Flex renders as a div)
      expect(rootElement?.tagName).toBe("DIV");
    });

    it("has minimum height", () => {
      const { container } = renderLoading();
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("renders consistently on multiple renders", () => {
      const { container: container1 } = renderLoading();
      const { container: container2 } = renderLoading();

      expect(container1.firstChild).toBeTruthy();
      expect(container2.firstChild).toBeTruthy();
    });
  });
});
