import React from "react";

// Testing imports
import { vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "../render";
import { MockedProvider } from "@apollo/client/testing/react";
import { InMemoryCache } from "@apollo/client";
import { gql } from "@apollo/client";

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
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Define the actual GraphQL queries
const GET_ENTITY = gql`
  query GetEntity($_id: String) {
    entity(_id: $_id) {
      _id
      name
      archived
      description
      attributes {
        _id
        name
      }
    }
  }
`;

const GET_PROJECT = gql`
  query GetProject($_id: String) {
    project(_id: $_id) {
      _id
      name
      archived
      description
      entities
    }
    projectEntities(_id: $_id) {
      _id
      name
    }
  }
`;

// Mock GraphQL queries
const mockDefaultEntityQuery = {
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
        description: "Test Description",
        attributes: [
          {
            _id: "test-attribute-id",
            name: "Test Attribute",
          },
        ],
        archived: false,
      },
    },
  },
};

const mockLongNameEntityQuery = {
  request: {
    query: GET_ENTITY,
    variables: { _id: "test-id-long-name" },
  },
  result: {
    data: {
      entity: {
        __typename: "Entity",
        _id: "test-id",
        name: "Test Entity Long Name",
        description: "Test Description",
        attributes: [
          {
            _id: "test-attribute-id",
            name: "Test Attribute",
          },
        ],
        archived: false,
      },
    },
  },
};

const renderLinky = (props: Partial<React.ComponentProps<typeof Linky>> = {}) => {
  const defaultProps = {
    id: "test-id",
    type: "entities" as const,
    fallback: "Loading...",
    ...props,
  };

  return render(
    <MockedProvider mocks={[mockDefaultEntityQuery, mockLongNameEntityQuery]} cache={createTestCache()}>
      <Linky {...defaultProps} />
    </MockedProvider>,
  );
};

describe("Linky Component", () => {
  describe("Default Rendering", () => {
    it("renders with loading state initially", () => {
      const { container } = renderLinky({ fallback: "Initial Fallback" });
      // Component shows a skeleton placeholder while the query is in flight
      expect(container.querySelector(".chakra-skeleton")).toBeTruthy();
    });

    it("renders fallback when query fails", async () => {
      const errorMock = {
        ...mockDefaultEntityQuery,
        result: {
          errors: [{ message: "Not found" }],
        },
      };

      render(
        <MockedProvider mocks={[errorMock]} cache={createTestCache()}>
          <Linky id={"test-id"} type={"entities"} fallback={"Initial Fallback"} />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Initial Fallback")).toBeTruthy();
      });
    });

    it("renders with custom size", async () => {
      renderLinky({ size: "sm" });
      await waitFor(() => {
        expect(screen.getAllByText("Test Entity")[0]).toBeTruthy();
      });
    });
  });

  describe("Truncation", () => {
    it("truncates by default", async () => {
      renderLinky({ id: "test-id-long-name", fallback: "Test Entity Long Name" });
      await waitFor(() => {
        expect(screen.getAllByText("Test Entity L...")[0]).toBeTruthy();
      });
    });

    it("does not truncate when truncate is false", async () => {
      renderLinky({ id: "test-id-long-name", fallback: "Test Entity Long Name", truncate: false });
      await waitFor(() => {
        expect(screen.getAllByText("Test Entity Long Name")[0]).toBeTruthy();
      });
    });

    it("truncates to custom length", async () => {
      renderLinky({ truncate: 10 });
      await waitFor(() => {
        expect(screen.getByText("Test En...")).toBeTruthy();
      });
    });
  });

  describe("Navigation", () => {
    it("does not navigate when deleted", async () => {
      const deletedMock = {
        ...mockDefaultEntityQuery,
        result: {
          errors: [{ message: "Not found" }],
        },
      };

      render(
        <MockedProvider mocks={[deletedMock]} cache={createTestCache()}>
          <Linky id={"test-id"} type={"entities"} fallback={"Deleted"} />
        </MockedProvider>,
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
              archived: false,
              description: "Test Project Description",
              entities: [],
            },
            projectEntities: [],
          },
        },
      };

      render(
        <MockedProvider mocks={[projectMock]} cache={createTestCache()}>
          <Linky id={"project-id"} type={"projects"} fallback={"Project"} />
        </MockedProvider>,
      );

      // Initially shows fallback or loading state
      // Wait for the query to complete and data to load
      await waitFor(
        () => {
          expect(screen.getAllByText("Test Project")[0]).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it("handles loading state", () => {
      const { container } = renderLinky();
      // Component shows a skeleton placeholder while the query is in flight
      expect(container.querySelector(".chakra-skeleton")).toBeTruthy();
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
        <MockedProvider mocks={[emptyIdMock]} cache={createTestCache()}>
          <Linky id={""} type={"entities"} fallback={"Missing ID Fallback"} />
        </MockedProvider>,
      );

      // Initially shows loading, then shows truncated fallback when query returns no data
      await waitFor(() => {
        expect(screen.getByText("Missing ID Fa...")).toBeTruthy();
      });
    });
  });
});
