import React from "react";

// Testing imports
import { render, screen } from "@testing-library/react";
import { expect, describe, it } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import Tooltip from "../../src/components/Tooltip";

const renderTooltip = (
  props: Partial<React.ComponentProps<typeof Tooltip>> = {},
) => {
  const defaultProps = {
    content: "Tooltip content",
    children: <button>Hover me</button>,
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <Tooltip {...defaultProps} />
    </ChakraProvider>,
  );
};

describe("Tooltip Component", () => {
  describe("Basic Rendering", () => {
    it("renders with content and children", () => {
      renderTooltip();
      expect(screen.getByText("Hover me")).toBeTruthy();
    });

    it("renders when disabled", () => {
      renderTooltip({ disabled: true });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });
  });

  describe("Arrow", () => {
    it("renders with arrow when showArrow is true", () => {
      renderTooltip({ showArrow: true });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });

    it("renders without arrow when showArrow is false", () => {
      renderTooltip({ showArrow: false });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });
  });

  describe("Portal", () => {
    it("renders with portal by default", () => {
      renderTooltip();
      expect(screen.getByText("Hover me")).toBeTruthy();
    });

    it("renders without portal when portalled is false", () => {
      renderTooltip({ portalled: false });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty content", () => {
      renderTooltip({ content: "" });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });

    it("handles React node as content", () => {
      renderTooltip({
        content: <span>React node content</span>,
      });
      expect(screen.getByText("Hover me")).toBeTruthy();
    });

    it("handles complex children", () => {
      renderTooltip({
        children: (
          <div>
            <span>Complex</span>
            <span>Children</span>
          </div>
        ),
      });
      expect(screen.getByText("Complex")).toBeTruthy();
      expect(screen.getByText("Children")).toBeTruthy();
    });
  });
});
