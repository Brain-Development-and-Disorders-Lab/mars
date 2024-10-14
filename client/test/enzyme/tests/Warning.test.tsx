import React from "react";

// Test imports
import { shallow } from "enzyme";
import { expect } from "@jest/globals";

// Component
import { Warning } from "../../../src/components/Label";

describe("Warning Component", () => {
  it("renders with provided text", () => {
    const testText = "Test Warning Message";
    const wrapper = shallow(<Warning text={testText} />);

    expect(wrapper.text()).toContain(testText);
    expect(wrapper.find("Icon").exists()).toBe(true);
  });
});
