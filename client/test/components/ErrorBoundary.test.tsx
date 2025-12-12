import React from "react";

// Testing imports
import { render, screen } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import ErrorBoundary from "../../src/components/ErrorBoundary";

// Mock Error component
jest.mock("../../src/components/Error", () => {
  return function MockError() {
    return <div>Error Component</div>;
  };
});

// Mock useNavigate
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

const renderErrorBoundary = (children: React.ReactNode) => {
  return render(
    <ChakraProvider value={theme}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ChakraProvider>,
  );
};

describe("ErrorBoundary Component", () => {
  describe("Error Handling", () => {
    it("renders children when no error occurs", () => {
      renderErrorBoundary(<div>Normal content</div>);
      expect(screen.getByText("Normal content")).toBeTruthy();
    });

    it("renders Error component when error occurs", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderErrorBoundary(<ThrowError shouldThrow={true} />);
      expect(screen.getByText("Error Component")).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it("catches errors in child components", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ComponentWithError = () => {
        throw new Error("Child component error");
      };

      renderErrorBoundary(<ComponentWithError />);
      expect(screen.getByText("Error Component")).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("handles multiple errors", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ComponentWithError = () => {
        throw new Error("First error");
      };

      const { rerender } = renderErrorBoundary(<ComponentWithError />);
      expect(screen.getByText("Error Component")).toBeTruthy();

      // Rerender with different error
      rerender(
        <ChakraProvider value={theme}>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ChakraProvider>,
      );

      expect(screen.getByText("Error Component")).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it("handles null children", () => {
      renderErrorBoundary(null);
      // Should not crash
      expect(screen.queryByText("Error Component")).toBeFalsy();
    });

    it("handles empty children", () => {
      renderErrorBoundary(<></>);
      // Should not crash
      expect(screen.queryByText("Error Component")).toBeFalsy();
    });
  });
});
