import React from "react";
import { Warning } from "../src/components/Label";
import { shallow } from "enzyme";

describe("Warning Component", () => {
  it("renders with provided text", () => {
    const testText = "Test Warning Message";
    const wrapper = shallow(<Warning text={testText} />);

    expect(wrapper.text()).toContain(testText);
    // If you want to check for the Icon component
    expect(wrapper.find("Icon").exists()).toBe(true);
  });
});
