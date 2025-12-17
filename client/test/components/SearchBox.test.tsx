import React from "react";

// Testing imports
import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { render } from "@testing-library/react";
import { expect } from "@jest/globals";

// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../../src/styles/theme";

// Target component
import SearchBox from "../../src/components/SearchBox";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

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

describe("SearchBox Component", () => {
  it("renders", () => {
    const { container } = render(
      <ChakraProvider value={theme}>
        <MockedProvider mocks={[]} cache={createTestCache()}>
          <SearchBox resultType={"entity"} />
        </MockedProvider>
      </ChakraProvider>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
