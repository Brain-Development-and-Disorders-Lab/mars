import React from "react";

// Testing imports
import { render, screen } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";
import { MockedProvider } from "@apollo/client/testing/react";
import { InMemoryCache } from "@apollo/client";
import { gql } from "@apollo/client";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import ActorTag from "../../src/components/ActorTag";

// Create test cache matching app configuration (without deprecated addTypename)
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

// Mock useBreakpoint hook
jest.mock("../../src/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({
    isBreakpointActive: jest.fn(() => false),
  }),
}));

// Define the actual GraphQL query
const GET_USER = gql`
  query GetUser($_id: String) {
    user(_id: $_id) {
      _id
      firstName
      lastName
    }
  }
`;

// Mock GraphQL query
const mockUserQuery = {
  request: {
    query: GET_USER,
    variables: { _id: "test-orcid" },
  },
  result: {
    data: {
      user: {
        __typename: "User",
        _id: "test-orcid",
        firstName: "John",
        lastName: "Doe",
      },
    },
  },
};

const renderActorTag = (
  props: Partial<React.ComponentProps<typeof ActorTag>> = {},
) => {
  const defaultProps: React.ComponentProps<typeof ActorTag> = {
    identifier: "test-orcid",
    fallback: "Test User",
    size: "md",
    ...props,
  };

  return render(
    <ChakraProvider value={theme}>
      <MockedProvider mocks={[mockUserQuery]} cache={createTestCache()}>
        <ActorTag {...defaultProps} />
      </MockedProvider>
    </ChakraProvider>,
  );
};

describe("ActorTag Component", () => {
  describe("Basic Rendering", () => {
    it("renders with fallback initially", () => {
      renderActorTag({ fallback: "Fallback Name" });
      expect(screen.getByText("Fallback Name")).toBeTruthy();
    });

    it("renders inline variant", () => {
      renderActorTag({ inline: true });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("renders avatar only variant", () => {
      const { container } = renderActorTag({ avatarOnly: true });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Size Variants", () => {
    it("renders with sm size", () => {
      renderActorTag({ size: "sm" });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("renders with default size", () => {
      renderActorTag();
      expect(screen.getByText("Test User")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing orcid", () => {
      renderActorTag({ orcid: "" });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("handles loading state", () => {
      renderActorTag();
      // Component should render even while loading
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("handles GraphQL error gracefully", () => {
      const errorMock = {
        ...mockUserQuery,
        result: {
          errors: [{ message: "Error fetching user" }],
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[errorMock]} cache={createTestCache()}>
            <ActorTag identifier="test-orcid" fallback="Fallback" size="md" />
          </MockedProvider>
        </ChakraProvider>,
      );

      expect(screen.getByText("Fallback")).toBeTruthy();
    });
  });
});
