// SearchBox.test.tsx

import React from "react";
import SearchBox from "./index";
import { shallow } from "enzyme";

jest.mock("@devices/Scanner", () => ({
  connectScanner: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

describe("SearchBox Component", () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = shallow(<SearchBox />);
  });

  it("renders", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("renders Flex", () => {
    expect(wrapper.find("Flex").exists()).toBe(true);
  });
});
