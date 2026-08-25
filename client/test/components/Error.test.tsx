import React from "react";

// Testing imports
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../render";

// Target component
import Error from "../../src/components/Error";
import { vi } from "vitest";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const renderError = () => {
  return render(<Error />);
};

describe("Error Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders error message", () => {
    renderError();
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("renders error description", () => {
    renderError();
    expect(screen.getByText(/Metadatify experienced an error/i)).toBeTruthy();
  });

  it("renders additional information", () => {
    renderError();
    expect(screen.getByText("Additional Information:")).toBeTruthy();
    expect(screen.getByText(/No error details available/i)).toBeTruthy();
  });

  it("renders reload button", () => {
    renderError();
    expect(screen.getByText("Reload Page")).toBeTruthy();
  });

  it("handles reload button click", () => {
    renderError();
    const reloadButton = screen.getByText("Reload Page");
    fireEvent.click(reloadButton);

    // Component uses navigate(0) to reload the page
    expect(mockNavigate).toHaveBeenCalledWith(0);
  });
});
