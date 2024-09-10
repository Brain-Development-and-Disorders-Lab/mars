import React from "react";

// Testing imports
import { MockedProvider } from "@apollo/client/testing";
import { shallow } from "enzyme";

// Target component
import SearchBox from "../src/components/SearchBox";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

describe("SearchBox Component", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = shallow(
      <MockedProvider>
        <SearchBox />
      </MockedProvider>,
    );
  });

  it("renders", () => {
    expect(wrapper.exists()).toBe(true);
  });
});
