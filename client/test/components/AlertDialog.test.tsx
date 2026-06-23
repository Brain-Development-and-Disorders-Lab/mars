import React from "react";

// Testing imports
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../render";

// Target component
import AlertDialog from "../../src/components/AlertDialog";

const renderAlertDialog = (props: Partial<React.ComponentProps<typeof AlertDialog>> = {}) => {
  const defaultProps = {
    open: true,
    setOpen: vi.fn(),
    children: <div>Dialog content</div>,
    header: "Alert",
    ...props,
  };

  return render(<AlertDialog {...defaultProps} />);
};

describe("AlertDialog Component", () => {
  describe("Basic Rendering", () => {
    it("renders when open", () => {
      renderAlertDialog({ open: true });
      expect(screen.getByText("Alert: Alert")).toBeTruthy();
      expect(screen.getByText("Dialog content")).toBeTruthy();
    });

    it("does not render when closed", () => {
      renderAlertDialog({ open: false });
      expect(screen.queryByText("Alert")).toBeFalsy();
    });

    it("renders with custom header", () => {
      renderAlertDialog({ header: "Custom Header" });
      expect(screen.getByText("Alert: Custom Header")).toBeTruthy();
    });
  });

  describe("Buttons", () => {
    it("renders default buttons", () => {
      renderAlertDialog();
      expect(screen.getByText("Cancel")).toBeTruthy();
      expect(screen.getByText("Confirm")).toBeTruthy();
    });

    it("renders custom button labels", () => {
      renderAlertDialog({
        leftButtonLabel: "No",
        rightButtonLabel: "Yes",
      });
      expect(screen.getByText("No")).toBeTruthy();
      expect(screen.getByText("Yes")).toBeTruthy();
    });

    it("calls left button action", () => {
      const leftButtonAction = vi.fn();
      renderAlertDialog({ leftButtonAction });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(leftButtonAction).toHaveBeenCalled();
    });

    it("calls right button action", () => {
      const rightButtonAction = vi.fn();
      renderAlertDialog({ rightButtonAction });

      const confirmButton = screen.getByText("Confirm");
      fireEvent.click(confirmButton);

      expect(rightButtonAction).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing button actions", () => {
      renderAlertDialog({
        leftButtonAction: undefined,
        rightButtonAction: undefined,
      });
      expect(screen.getByText("Cancel")).toBeTruthy();
      expect(screen.getByText("Confirm")).toBeTruthy();
    });

    it("handles children with HTML components", () => {
      renderAlertDialog({
        children: (
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
        ),
      });
      expect(screen.getByText("Paragraph 1")).toBeTruthy();
      expect(screen.getByText("Paragraph 2")).toBeTruthy();
    });
  });
});
