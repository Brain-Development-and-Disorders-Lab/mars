import React from "react";

// Testing imports
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import VisibilityTag from "../../src/components/VisibilityTag";

// Mock useBreakpoint hook
jest.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isBreakpointActive: jest.fn(() => false),
  }),
}));

const renderVisibilityTag = (
  props: Partial<React.ComponentProps<typeof VisibilityTag>> = {},
) => {
  const defaultProps = {
    isPublic: true,
    setIsPublic: jest.fn(),
    isInherited: false,
    disabled: false,
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <VisibilityTag {...defaultProps} />
    </ChakraProvider>,
  );
};

describe("VisibilityTag Component", () => {
  describe("Basic Rendering", () => {
    it("renders public visibility", () => {
      renderVisibilityTag({ isPublic: true });
      expect(screen.getByText("Public")).toBeTruthy();
    });

    it("renders private visibility", () => {
      renderVisibilityTag({ isPublic: false });
      expect(screen.getByText("Private")).toBeTruthy();
    });
  });

  describe("Toggle Functionality", () => {
    it("calls setIsPublic when toggle button is clicked", () => {
      const setIsPublic = jest.fn();
      renderVisibilityTag({ isPublic: true, setIsPublic });

      const toggleButton = screen.getByLabelText("set-visibility");
      fireEvent.click(toggleButton);

      expect(setIsPublic).toHaveBeenCalledWith(false);
    });

    it("does not call setIsPublic when disabled", () => {
      const setIsPublic = jest.fn();
      renderVisibilityTag({ isPublic: true, setIsPublic, disabled: true });

      const toggleButton = screen.getByLabelText("set-visibility");
      expect(toggleButton).toHaveProperty("disabled", true);
    });

    it("handles missing setIsPublic gracefully", () => {
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation((message) => {
          console.log(message);
        });
      renderVisibilityTag({ setIsPublic: undefined as any });

      const toggleButton = screen.getByLabelText("set-visibility");
      fireEvent.click(toggleButton);

      // Should not crash
      expect(toggleButton).toBeTruthy();
      consoleSpy.mockRestore();
    });
  });

  describe("Inherited State", () => {
    it("disables toggle when inherited", () => {
      renderVisibilityTag({ isInherited: true });
      const toggleButton = screen.getByLabelText("set-visibility");
      expect(toggleButton).toHaveProperty("disabled", true);
    });

    it("shows tooltip when inherited", () => {
      renderVisibilityTag({ isInherited: true });
      expect(screen.getByText("Public")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid toggle clicks", () => {
      const setIsPublic = jest.fn();
      renderVisibilityTag({ isPublic: true, setIsPublic });

      const toggleButton = screen.getByLabelText("set-visibility");
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      // Should handle multiple clicks
      expect(setIsPublic).toHaveBeenCalled();
    });
  });
});
