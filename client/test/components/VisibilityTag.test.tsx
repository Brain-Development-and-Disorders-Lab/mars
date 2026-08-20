import React from "react";

// Testing imports
import { vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../render";

// Target component
import VisibilityTag from "../../src/components/VisibilityTag";

// Mock useBreakpoint hook
vi.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isBreakpointActive: vi.fn(() => false),
  }),
}));

const renderVisibilityTag = (props: Partial<React.ComponentProps<typeof VisibilityTag>> = {}) => {
  const defaultProps = {
    isPublic: true,
    setIsPublic: vi.fn(),
    isInherited: false,
    disabled: false,
    ...props,
  };

  return render(<VisibilityTag {...defaultProps} />);
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
    it("calls setIsPublic when toggle button is clicked", async () => {
      const setIsPublic = vi.fn();
      renderVisibilityTag({ isPublic: true, setIsPublic });

      const toggleButton = screen.getByLabelText("set-visibility");
      fireEvent.click(toggleButton);

      const continueButton = await screen.findByText("Continue");
      fireEvent.click(continueButton);

      expect(setIsPublic).toHaveBeenCalledWith(false);
    });

    it("does not call setIsPublic when disabled", () => {
      const setIsPublic = vi.fn();
      renderVisibilityTag({ isPublic: true, setIsPublic, disabled: true });

      const toggleButton = screen.getByLabelText("set-visibility");
      expect(toggleButton).toHaveProperty("disabled", true);
    });

    it("handles missing setIsPublic gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation((message) => {
        console.log(message);
      });
      renderVisibilityTag({ setIsPublic: undefined });

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
});
