import React from "react";
import { shallow } from "enzyme";
import SearchQueryValue from "../src/pages/search/SearchQueryValue";

jest.mock("@database/functions", () => ({
  request: jest.fn(),
}));

describe("QueryBuilder Component", () => {
  let wrapper: any;
  let mockOnSearchBuiltQuery: any;
  let mockSetIsSearching: any;
  let mockSetHasSearched: any;
  let mockSetResults: any;
  let mockToast: any;

  beforeEach(() => {
    mockOnSearchBuiltQuery = jest.fn();
    mockSetIsSearching = jest.fn();
    mockSetHasSearched = jest.fn();
    mockSetResults = jest.fn();
    mockToast = jest.fn();

    // Mock the props as per your requirements
    const mockProps = {
      setIsSearching: mockSetIsSearching,
      setHasSearched: mockSetHasSearched,
      setResults: mockSetResults,
      toast: mockToast,
      mockOnSearchBuiltQuery: mockOnSearchBuiltQuery,
      // ... other mock props
    };

    wrapper = shallow(<SearchQueryValue {...mockProps} />);
  });

  it("renders", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("renders QueryBuilder", () => {
    expect(wrapper.find("QueryBuilder").exists()).toBe(true);
  });
});
