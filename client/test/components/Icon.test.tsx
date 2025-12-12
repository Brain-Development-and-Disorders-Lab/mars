import React from "react";

// Testing imports
import { render } from "@testing-library/react";
import { expect, describe, it } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import Icon from "../../src/components/Icon";

const renderIcon = (props: React.ComponentProps<typeof Icon>) => {
  return render(
    <ChakraProvider value={theme}>
      <Icon {...props} />
    </ChakraProvider>,
  );
};

describe("Icon Component", () => {
  describe("Basic Rendering", () => {
    it("renders with valid icon name", () => {
      const { container } = renderIcon({ name: "search" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders unknown icon for invalid icon name", () => {
      const { container } = renderIcon({ name: "invalid-icon-name" as any });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders with default size when not specified", () => {
      const { container } = renderIcon({ name: "search" });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Size Variants", () => {
    it("renders xs size", () => {
      const { container } = renderIcon({ name: "search", size: "xs" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders sm size", () => {
      const { container } = renderIcon({ name: "search", size: "sm" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders md size", () => {
      const { container } = renderIcon({ name: "search", size: "md" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders lg size", () => {
      const { container } = renderIcon({ name: "search", size: "lg" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders xl size", () => {
      const { container } = renderIcon({ name: "search", size: "xl" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders with custom size array", () => {
      const { container } = renderIcon({ name: "search", size: [24, 24] });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Color", () => {
    it("renders with custom color", () => {
      const { container } = renderIcon({ name: "search", color: "red" });
      expect(container.firstChild).toBeTruthy();
    });

    it("renders without color when not specified", () => {
      const { container } = renderIcon({ name: "search" });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Style", () => {
    it("renders with custom style", () => {
      const customStyle = { margin: "10px" };
      const { container } = renderIcon({
        name: "search",
        style: customStyle,
      });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles all icon types", () => {
      const iconNames = [
        "search",
        "entity",
        "project",
        "dashboard",
        "add",
        "delete",
        "edit",
        "close",
      ];

      iconNames.forEach((name) => {
        const { container } = renderIcon({ name: name as any });
        expect(container.firstChild).toBeTruthy();
      });
    });

    it("handles empty string as icon name", () => {
      const { container } = renderIcon({ name: "" as any });
      expect(container.firstChild).toBeTruthy();
    });

    it("handles special characters in style", () => {
      const { container } = renderIcon({
        name: "search",
        style: { transform: "rotate(45deg)" },
      });
      expect(container.firstChild).toBeTruthy();
    });
  });
});
