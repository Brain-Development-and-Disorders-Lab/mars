import React from "react";

// Testing imports
import { screen } from "@testing-library/react";
import { render } from "../render";

// Target component
import FieldTagList from "../../src/components/FieldTagList";

// Build `count` items named "Item 1" through "Item N"
const createItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ _id: `item-${i + 1}`, name: `Item ${i + 1}` }));

const renderFieldTagList = (props: Partial<React.ComponentProps<typeof FieldTagList>> = {}) => {
  const defaultProps: React.ComponentProps<typeof FieldTagList> = {
    items: createItems(3),
    getKey: (item) => item._id,
    renderTag: (item) => <span>{item.name}</span>,
    ...props,
  };

  return render(<FieldTagList {...defaultProps} />);
};

describe("FieldTagList Component", () => {
  describe("Empty list", () => {
    it("renders the empty label when set", () => {
      renderFieldTagList({ items: [], emptyLabel: "Values" });
      expect(screen.getByText("No Values")).toBeTruthy();
    });

    it("renders nothing without an empty label", () => {
      const { container } = renderFieldTagList({ items: [] });
      expect(container.textContent).toBe("");
    });
  });

  describe("Overflow", () => {
    it("renders every item without an overflow tag when under the limit", () => {
      renderFieldTagList({ items: createItems(3) });
      expect(screen.getByText("Item 1")).toBeTruthy();
      expect(screen.getByText("Item 3")).toBeTruthy();
      expect(screen.queryByText(/more$/)).toBeNull();
    });

    it("limits to five items by default and summarizes the rest", () => {
      renderFieldTagList({ items: createItems(7) });
      expect(screen.getByText("Item 5")).toBeTruthy();
      expect(screen.queryByText("Item 6")).toBeNull();
      expect(screen.getByText("+2 more")).toBeTruthy();
    });

    it("respects a custom max", () => {
      renderFieldTagList({ items: createItems(4), max: 2 });
      expect(screen.getByText("Item 2")).toBeTruthy();
      expect(screen.queryByText("Item 3")).toBeNull();
      expect(screen.getByText("+2 more")).toBeTruthy();
    });
  });
});
