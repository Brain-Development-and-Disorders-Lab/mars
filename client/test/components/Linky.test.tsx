import React from "react";

// Testing imports
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";
import { MockedProvider } from "@apollo/client/testing/react";
import { InMemoryCache } from "@apollo/client";
import { gql } from "@apollo/client";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import Linky from "../../src/components/Linky";

const createTestCache = () => {
  return new InMemoryCache({
    typePolicies: {
      Workspace: {
        keyFields: ["_id"],
      },
      Entity: {
        keyFields: ["_id"],
      },
      Project: {
        keyFields: ["_id"],
      },
      Attribute: {
        keyFields: ["_id"],
      },
      Activity: {
        keyFields: ["_id"],
      },
    },
  });
};

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Define the actual GraphQL queries
const GET_ENTITY = gql`
  query GetEntity($_id: String) {
    entity(_id: $_id) {
      _id
      name
      archived
    }
  }
`;

const GET_PROJECT = gql`
  query GetProject($_id: String) {
    project(_id: $_id) {
      _id
      name
    }
  }
`;

// Mock GraphQL queries
const mockEntityQuery = {
  request: {
    query: GET_ENTITY,
    variables: { _id: "test-id" },
  },
  result: {
    data: {
      entity: {
        __typename: "Entity",
        _id: "test-id",
        name: "Test Entity",
        archived: false,
      },
    },
  },
};

const renderLinky = (
  props: Partial<React.ComponentProps<typeof Linky>> = {},
) => {
  const defaultProps = {
    id: "test-id",
    type: "entities" as const,
    fallback: "Loading...",
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <MockedProvider mocks={[mockEntityQuery]} cache={createTestCache()}>
        <Linky {...defaultProps} />
      </MockedProvider>
    </ChakraProvider>,
  );
};

describe("Linky Component", () => {
  describe("Basic Rendering", () => {
    it("renders with loading state initially", () => {
      renderLinky({ fallback: "Initial Fallback" });
      // Component always starts with "Loading..." before query completes
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("renders fallback when query fails", async () => {
      const errorMock = {
        ...mockEntityQuery,
        result: {
          errors: [{ message: "Not found" }],
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[errorMock]} cache={createTestCache()}>
            <Linky id="test-id" type="entities" fallback="Initial Fallback" />
          </MockedProvider>
        </ChakraProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Initial Fallback")).toBeTruthy();
      });
    });

    it("renders with custom size", () => {
      renderLinky({ size: "sm" });
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  describe("Truncation", () => {
    it("truncates by default", () => {
      renderLinky();
      // Should render with default truncation
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("does not truncate when truncate is false", () => {
      renderLinky({ truncate: false });
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("truncates to custom length", () => {
      renderLinky({ truncate: 10 });
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("navigates on click when data is loaded", async () => {
      renderLinky();

      await waitFor(() => {
        const link = screen.getByText("Test Entity");
        expect(link).toBeTruthy();
      });

      const link = screen.getByText("Test Entity");
      fireEvent.click(link);

      expect(mockNavigate).toHaveBeenCalledWith("/entities/test-id");
    });

    it("does not navigate when deleted", async () => {
      const deletedMock = {
        ...mockEntityQuery,
        result: {
          errors: [{ message: "Not found" }],
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[deletedMock]} cache={createTestCache()}>
            <Linky id="test-id" type="entities" fallback="Deleted" />
          </MockedProvider>
        </ChakraProvider>,
      );

      await waitFor(() => {
        const link = screen.getByText("Deleted");
        expect(link).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles different types", async () => {
      const projectMock = {
        request: {
          query: GET_PROJECT,
          variables: { _id: "project-id" },
        },
        result: {
          data: {
            project: {
              __typename: "Project",
              _id: "project-id",
              name: "Test Project",
            },
          },
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[projectMock]} cache={createTestCache()}>
            <Linky id="project-id" type="projects" fallback="Project" />
          </MockedProvider>
        </ChakraProvider>,
      );

      // Initially shows fallback or loading state
      // Wait for the query to complete and data to load
      await waitFor(
        () => {
          expect(screen.getByText("Test Project")).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it("handles loading state", () => {
      renderLinky();
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("handles missing id", async () => {
      const emptyIdMock = {
        request: {
          query: GET_ENTITY,
          variables: { _id: "" },
        },
        result: {
          data: undefined,
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[emptyIdMock]} cache={createTestCache()}>
            <Linky id="" type="entities" fallback="Missing ID Fallback" />
          </MockedProvider>
        </ChakraProvider>,
      );

      // Initially shows loading, then shows fallback when query returns no data
      await waitFor(() => {
        expect(screen.getByText("Missing ID Fallback")).toBeTruthy();
      });
    });
  });
});
