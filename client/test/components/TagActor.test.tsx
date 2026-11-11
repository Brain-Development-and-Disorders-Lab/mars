import React from "react";

// Testing imports
import { screen } from "@testing-library/react";
import { render } from "../render";
import { MockedProvider } from "@apollo/client/testing/react";
import { InMemoryCache } from "@apollo/client";
import { gql } from "@apollo/client";

// Chakra UI imports
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import TagActor from "../../src/components/TagActor";

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

// Matches the authenticated query in `useActor`
const GET_ACTOR_USER = gql`
  query GetActorUser($_id: String) {
    user(_id: $_id) {
      _id
      name
      firstName
      lastName
      image
      account_orcid
      affiliation
      email
    }
  }
`;

// Mock GraphQL query
const mockDefaultUserQuery = {
  request: {
    query: GET_ACTOR_USER,
    variables: { _id: "test-orcid" },
  },
  result: {
    data: {
      user: {
        __typename: "User",
        _id: "test-orcid",
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        image: "",
        account_orcid: "",
        affiliation: "",
        email: "",
      },
    },
  },
};

const renderActorTag = (props: Partial<React.ComponentProps<typeof TagActor>> = {}) => {
  const defaultProps: React.ComponentProps<typeof TagActor> = {
    identifier: "test-orcid",
    fallback: "Test User",
    size: "md",
    ...props,
  };

  return render(
    <MockedProvider mocks={[mockDefaultUserQuery]} cache={createTestCache()}>
      <TagActor {...defaultProps} />
    </MockedProvider>,
  );
};

describe("TagActor Component", () => {
  describe("Default Behavior", () => {
    it("renders with fallback initially", () => {
      renderActorTag({ fallback: "Fallback Name" });
      expect(screen.getByText("Fallback Name")).toBeTruthy();
    });

    it("renders inline variant", () => {
      renderActorTag({ variant: "inline", identifier: "" });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("renders name variant", () => {
      renderActorTag({ variant: "name", identifier: "" });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("renders the full name once loaded", async () => {
      renderActorTag();
      expect(await screen.findByText("John Doe")).toBeTruthy();
    });

    it("renders initials in the avatar variant once loaded", async () => {
      renderActorTag({ variant: "avatar" });
      expect(await screen.findByText("JD")).toBeTruthy();
    });

    it("renders avatar only variant", () => {
      const { container } = renderActorTag({ variant: "avatar" });
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe("Missing Data", () => {
    it("handles missing orcid", () => {
      renderActorTag({ identifier: "" });
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("handles loading state", () => {
      renderActorTag();
      // Component should render even while loading
      expect(screen.getByText("Test User")).toBeTruthy();
    });

    it("handles GraphQL error gracefully", () => {
      const errorMock = {
        ...mockDefaultUserQuery,
        result: {
          errors: [{ message: "Error fetching user" }],
        },
      };

      render(
        <ChakraProvider value={theme}>
          <MockedProvider mocks={[errorMock]} cache={createTestCache()}>
            <TagActor identifier="test-orcid" fallback="Fallback" size="md" />
          </MockedProvider>
        </ChakraProvider>,
      );

      expect(screen.getByText("Fallback")).toBeTruthy();
    });
  });
});
