import React from "react";

// Testing imports
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "../render";

// Target component
import Values from "../../src/components/Values";
import { IValue, ColumnInfo } from "../../../types";

// Mock useBreakpoint to avoid depending on window.matchMedia in jsdom
vi.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    breakpoint: "lg",
    isBreakpointActive: () => true,
    getResponsiveValue: (_values: unknown, defaultValue: unknown) => defaultValue,
  }),
}));

// Mock SelectSearch and Linky, both of which depend on GraphQL queries unrelated to Values' own behavior
vi.mock("../../src/components/SelectSearch", () => ({
  default: (props: {
    value: { _id: string; name: string };
    onChange: (value: { _id: string; name: string }) => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid={"mock-search-select"}
      disabled={props.disabled}
      onClick={() => props.onChange({ _id: "e_new", name: "New Entity" })}
    >
      {props.value?.name || "Select Entity"}
    </button>
  ),
}));

vi.mock("../../src/components/Linky", () => ({
  default: (props: { id: string }) => <span data-testid={"mock-linky"}>{props.id || "no-entity"}</span>,
}));

const createValue = (overrides: Partial<IValue> = {}): IValue => ({
  _id: "v_1",
  name: "Field",
  type: "text",
  data: "hello",
  ...overrides,
});

const renderValues = (props: Partial<React.ComponentProps<typeof Values>> & { values: IValue[] }) => {
  const setValues = vi.fn();
  const defaultProps = {
    setValues,
    ...props,
  };
  const utils = render(<Values {...defaultProps} />);
  return { ...utils, setValues };
};

// setValues is called with either a full array or a React updater function depending on the
// action; this resolves either form against `current` to get the array actually being applied.
const applyLastUpdate = (setValues: ReturnType<typeof vi.fn>, current: IValue[]): IValue[] => {
  const arg = setValues.mock.calls[setValues.mock.calls.length - 1][0];
  return typeof arg === "function" ? arg(current) : arg;
};

describe("Values Component", () => {
  describe("Default Rendering", () => {
    it("renders provided values", async () => {
      const values = [createValue({ name: "Field One", type: "text", data: "hello" })];
      renderValues({ values });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Field One")).toBeTruthy();
        expect(screen.getByDisplayValue("hello")).toBeTruthy();
        expect(screen.getByText("Text")).toBeTruthy();
      });
    });

    it("renders an empty table when no values provided", async () => {
      renderValues({ values: [] });
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeTruthy();
        expect(screen.getByText("Type")).toBeTruthy();
        expect(screen.getByText("Data")).toBeTruthy();
      });
    });
  });

  describe("Adding and Removing Rows", () => {
    it("adds a new row with default values when Add Value is clicked", async () => {
      const values = [createValue()];
      const { setValues } = renderValues({ values });

      fireEvent.click(screen.getByRole("button", { name: "Add Value" }));

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(updated).toHaveLength(2);
      expect(updated[1]).toMatchObject({ name: "", type: "text", data: "" });
    });

    it("removes selected rows via the Actions menu", async () => {
      const values = [createValue({ _id: "v_1", name: "First" }), createValue({ _id: "v_2", name: "Second" })];
      const { setValues } = renderValues({ values });

      // Checkbox order: [select-all, row 1, row 2]
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]);

      fireEvent.click(screen.getByRole("button", { name: /Actions/i }));

      const removeItem = await screen.findByText(/Remove Values \(1\)/);
      fireEvent.click(removeItem);

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(updated).toEqual([values[1]]);
    });
  });

  describe("Type Switching", () => {
    it("resets data to the type default when the type changes", async () => {
      const values = [createValue({ type: "text", data: "hello" })];
      const { setValues } = renderValues({ values });

      const typeSelect = screen.getAllByRole("combobox")[0];
      fireEvent.mouseDown(typeSelect);

      const numberOption = await screen.findByText("Number");
      fireEvent.click(numberOption);

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(updated[0]).toMatchObject({ type: "number", data: "0" });
    });
  });

  describe("Select Type", () => {
    it("adds options through the Add Options dialog and confirms them", async () => {
      const values = [createValue({ type: "select", data: JSON.stringify({ selected: "", options: [] }) })];
      const { setValues } = renderValues({ values });

      fireEvent.click(screen.getByText("Add Options"));

      const input = await screen.findByPlaceholderText("Enter Option");
      fireEvent.change(input, { target: { value: "Option A" } });
      fireEvent.click(screen.getByRole("button", { name: "Add" }));

      const confirmButton = await screen.findByRole("button", { name: "Confirm" });
      await waitFor(() => expect(confirmButton).toBeEnabled());
      fireEvent.click(confirmButton);

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(JSON.parse(updated[0].data)).toEqual({ selected: "Option A", options: ["Option A"] });
    });
  });

  describe("Entity Type", () => {
    it("renders SelectSearch when editable", async () => {
      const values = [createValue({ type: "entity", data: JSON.stringify({ _id: "", name: "" }) })];
      renderValues({ values });

      await waitFor(() => {
        expect(screen.getByTestId("mock-search-select")).toBeTruthy();
      });
    });

    it("renders Linky in view-only mode", async () => {
      const values = [createValue({ type: "entity", data: JSON.stringify({ _id: "e_1", name: "Entity One" }) })];
      renderValues({ values, viewOnly: true });

      await waitFor(() => {
        expect(screen.getByTestId("mock-linky")).toHaveTextContent("e_1");
      });
    });
  });

  describe("URL Type (view only)", () => {
    it("renders a link for a valid URL", async () => {
      const values = [createValue({ type: "url", data: "https://example.com/docs" })];
      renderValues({ values, viewOnly: true });

      await waitFor(() => {
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "https://example.com/docs");
        expect(link).toHaveTextContent("example.com");
      });
    });

    it("renders a warning instead of a link for an invalid URL", async () => {
      const values = [createValue({ type: "url", data: "not a valid url" })];
      renderValues({ values, viewOnly: true });

      await waitFor(() => {
        expect(screen.queryByRole("link")).toBeNull();
        expect(screen.getByText("not a valid url")).toBeTruthy();
      });
    });
  });

  describe("View Only Mode", () => {
    it("disables editing and hides row controls", async () => {
      const values = [createValue({ name: "Field", type: "text", data: "hello" })];
      renderValues({ values, viewOnly: true });

      await waitFor(() => {
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
        expect(screen.queryByRole("button", { name: "Add Value" })).toBeNull();
        expect(screen.getByDisplayValue("Field")).toHaveAttribute("readonly");
      });
    });
  });

  describe("Import Mode (permittedValues)", () => {
    it("toggles between column and value source", async () => {
      const permittedValues: ColumnInfo[] = [{ name: "col_a", inferredType: "number" }];
      const values = [createValue({ type: "number", data: "col_a", source: "column" })];
      const { setValues } = renderValues({ values, permittedValues });

      fireEvent.click(screen.getByRole("button", { name: "switch-to-value" }));

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(updated[0]).toMatchObject({ source: "value", data: "0" });
    });

    it("switches the selected column via the column picker", async () => {
      const permittedValues: ColumnInfo[] = [
        { name: "col_a", inferredType: "text" },
        { name: "col_b", inferredType: "text" },
      ];
      const values = [createValue({ type: "text", data: "col_a", source: "column" })];
      const { setValues } = renderValues({ values, permittedValues });

      // Combobox order: [type select, column picker]
      const comboboxes = screen.getAllByRole("combobox");
      fireEvent.mouseDown(comboboxes[1]);

      const columnBOption = await screen.findByText("col_b");
      fireEvent.click(columnBOption);

      await waitFor(() => expect(setValues).toHaveBeenCalled());
      const updated = applyLastUpdate(setValues, values);
      expect(updated[0]).toMatchObject({ data: "col_b" });
    });
  });
});
