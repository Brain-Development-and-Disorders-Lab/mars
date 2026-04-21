import React from "react";

// Testing imports
import { InMemoryCache } from "@apollo/client";
import { MockedProvider, MockedResponse } from "@apollo/client/testing/react";
import { gql } from "@apollo/client";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, describe, it, jest } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import SearchBox from "../../src/components/SearchBox";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));

const createTestCache = () => {
  return new InMemoryCache({
    typePolicies: {
      Workspace: { keyFields: ["_id"] },
      Entity: { keyFields: ["_id"] },
      Project: { keyFields: ["_id"] },
      Attribute: { keyFields: ["_id"] },
      Activity: { keyFields: ["_id"] },
    },
  });
};

const TRANSLATE_SEARCH = gql`
  query TranslateSearch($query: String!) {
    translateSearch(query: $query)
  }
`;

const SEARCH_TEXT = gql`
  query Search(
    $query: String
    $resultType: String
    $isBuilder: Boolean
    $showArchived: Boolean
    $filters: EntityFilterInput
  ) {
    search(
      query: $query
      resultType: $resultType
      isBuilder: $isBuilder
      showArchived: $showArchived
      filters: $filters
    ) {
      __typename
      ... on Entity {
        _id
        name
        owner
        archived
        description
        projects
        attributes {
          _id
          name
          description
          values {
            _id
            name
            type
            data
          }
        }
      }
    }
  }
`;

const TRANSLATED_QUERY = '{"name": {"$regex": "sample", "$options": "i"}}';

const mockTranslateSearch = (query: string) => ({
  request: {
    query: TRANSLATE_SEARCH,
    variables: { query },
  },
  result: {
    data: {
      translateSearch: TRANSLATED_QUERY,
    },
  },
});

const mockSearchText = (translatedQuery: string, results = [] as object[]) => ({
  request: {
    query: SEARCH_TEXT,
    variables: {
      query: translatedQuery,
      resultType: "entity",
      isBuilder: true,
      showArchived: false,
    },
  },
  result: {
    data: {
      search: results,
    },
  },
});

const mockEntityResults = [
  {
    __typename: "Entity",
    _id: "entity-1",
    name: "Sample Entity",
    owner: "user-1",
    archived: false,
    description: "A test entity",
    projects: [],
    attributes: [],
  },
  {
    __typename: "Entity",
    _id: "entity-2",
    name: "Another Entity",
    owner: "user-1",
    archived: false,
    description: "Another test entity",
    projects: [],
    attributes: [],
  },
];

const renderSearchBox = (mocks: MockedResponse[] = []) =>
  render(
    <ChakraProvider value={theme}>
      <MockedProvider mocks={mocks} cache={createTestCache()}>
        <SearchBox />
      </MockedProvider>
    </ChakraProvider>,
  );

describe("SearchBox Component", () => {
  it("renders", () => {
    const { container } = renderSearchBox();
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the search input and button", () => {
    renderSearchBox();
    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(input).toBeTruthy();
    expect(button).toBeTruthy();
  });

  it("disables the search button when query is empty", () => {
    renderSearchBox();
    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("enables the search button when query is entered", () => {
    renderSearchBox();
    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "find sample entities" } });
    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("translates query and searches when button is clicked", async () => {
    const userQuery = "find sample entities";
    const mocks = [mockTranslateSearch(userQuery), mockSearchText(TRANSLATED_QUERY, mockEntityResults)];

    renderSearchBox(mocks);

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: userQuery } });

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Sample Entity")).toBeTruthy();
    });
  });

  it("translates query and searches on Enter key press", async () => {
    const userQuery = "find sample entities";
    const mocks = [mockTranslateSearch(userQuery), mockSearchText(TRANSLATED_QUERY, mockEntityResults)];

    renderSearchBox(mocks);

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: userQuery } });
    fireEvent.keyUp(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Sample Entity")).toBeTruthy();
    });
  });

  it("shows 'No results found' when search returns empty", async () => {
    const userQuery = "find nonexistent entities";
    const mocks = [mockTranslateSearch(userQuery), mockSearchText(TRANSLATED_QUERY, [])];

    renderSearchBox(mocks);

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: userQuery } });

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("No results found.")).toBeTruthy();
    });
  });

  it("shows multiple results up to the display limit", async () => {
    const userQuery = "find sample entities";
    const mocks = [mockTranslateSearch(userQuery), mockSearchText(TRANSLATED_QUERY, mockEntityResults)];

    renderSearchBox(mocks);

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: userQuery } });

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Sample Entity")).toBeTruthy();
      expect(screen.getByText("Another Entity")).toBeTruthy();
    });
  });

  it("resets results when query changes after a search", async () => {
    const userQuery = "find sample entities";
    const mocks = [mockTranslateSearch(userQuery), mockSearchText(TRANSLATED_QUERY, mockEntityResults)];

    renderSearchBox(mocks);

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: userQuery } });

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Sample Entity")).toBeTruthy();
    });

    fireEvent.change(input, { target: { value: "new query" } });

    expect(screen.queryByText("Sample Entity")).toBeNull();
  });

  it("does not search when query is empty", () => {
    renderSearchBox();
    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.keyUp(input, { key: "Enter" });
    expect(screen.queryByText("No results found.")).toBeNull();
  });
});
