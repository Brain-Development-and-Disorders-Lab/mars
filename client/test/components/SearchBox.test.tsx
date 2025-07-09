import React from "react";

// Testing imports
import { MockedProvider } from "@apollo/client/testing";
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

describe("SearchBox Component", () => {
  it("renders", () => {
    const { container } = render(
      <ChakraProvider value={theme}>
        <MockedProvider>
          <SearchBox resultType={"entity"} />
        </MockedProvider>
      </ChakraProvider>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
