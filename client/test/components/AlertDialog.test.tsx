import React from "react";

// Testing imports
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import AlertDialog from "../../src/components/AlertDialog";

const renderAlertDialog = (
  props: Partial<React.ComponentProps<typeof AlertDialog>> = {},
) => {
  const defaultProps = {
    open: true,
    setOpen: jest.fn(),
    children: <div>Dialog content</div>,
    header: "Alert",
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <AlertDialog {...defaultProps} />
    </ChakraProvider>,
  );
};

describe("AlertDialog Component", () => {
  describe("Basic Rendering", () => {
    it("renders when open", () => {
      renderAlertDialog({ open: true });
      expect(screen.getByText("Alert")).toBeTruthy();
      expect(screen.getByText("Dialog content")).toBeTruthy();
    });

    it("does not render when closed", () => {
      renderAlertDialog({ open: false });
      expect(screen.queryByText("Alert")).toBeFalsy();
    });

    it("renders with custom header", () => {
      renderAlertDialog({ header: "Custom Header" });
      expect(screen.getByText("Custom Header")).toBeTruthy();
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
      const leftButtonAction = jest.fn();
      renderAlertDialog({ leftButtonAction });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(leftButtonAction).toHaveBeenCalled();
    });

    it("calls right button action", () => {
      const rightButtonAction = jest.fn();
      renderAlertDialog({ rightButtonAction });

      const confirmButton = screen.getByText("Confirm");
      fireEvent.click(confirmButton);

      expect(rightButtonAction).toHaveBeenCalled();
    });
  });

  describe("Button Colors", () => {
    it("uses custom left button color", () => {
      renderAlertDialog({ leftButtonColor: "blue" });
      expect(screen.getByText("Cancel")).toBeTruthy();
    });

    it("uses custom right button color", () => {
      renderAlertDialog({ rightButtonColor: "purple" });
      expect(screen.getByText("Confirm")).toBeTruthy();
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

    it("handles complex children", () => {
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

    it("handles rapid open/close", async () => {
      const setOpen = jest.fn();
      const { rerender } = renderAlertDialog({ open: true, setOpen });

      rerender(
        <ChakraProvider value={theme}>
          <AlertDialog open={false} setOpen={setOpen} header="Alert">
            <div>Content</div>
          </AlertDialog>
        </ChakraProvider>,
      );

      await waitFor(() => {
        expect(screen.queryByText("Alert")).toBeFalsy();
      });
    });
  });
});
