import React from "react";

// Testing imports
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, describe, it, beforeEach } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import Error from "../../src/components/Error";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const renderError = () => {
  return render(
    <ChakraProvider value={theme}>
      <Error />
    </ChakraProvider>,
  );
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
