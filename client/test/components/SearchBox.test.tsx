// Testing imports
import { vi } from "vitest";
import { InMemoryCache } from "@apollo/client";
import { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { fireEvent } from "@testing-library/react";
import { render } from "../render";

// Target component
import SearchBox from "../../src/components/SearchBox";

// Variables
import { DEFAULT_GLOBAL_PERMISSIONS, DEFAULT_WORKSPACE_PERMISSIONS } from "../../src/variables";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("../../src/hooks/usePermissions", () => ({
  usePermissions: vi.fn(() => ({
    workspacePermissions: DEFAULT_WORKSPACE_PERMISSIONS,
    globalPermissions: DEFAULT_GLOBAL_PERMISSIONS,
  })),
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

const renderSearchBox = (mocks: MockLink.MockedResponse[] = []) =>
  render(
    <MockedProvider mocks={mocks} cache={createTestCache()}>
      <SearchBox />
    </MockedProvider>,
  );

describe("SearchBox Component", () => {
  it("renders", () => {
    const { container } = renderSearchBox();
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the search input and button", () => {
    renderSearchBox();

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    expect(input).toBeTruthy();

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(button).toBeTruthy();
  });

  it("disables the search button when query is empty", () => {
    renderSearchBox();

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(button).toBeDisabled();
  });

  it("enables the search button when query is entered", () => {
    renderSearchBox();

    const input = document.querySelector("[data-search-input]") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "find sample entities" } });

    const button = document.querySelector("[data-search-button]") as HTMLButtonElement;
    expect(button).toBeEnabled();
  });
});
