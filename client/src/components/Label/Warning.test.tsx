// Warning.test.tsx

import React, { ReactElement } from 'react';
// import { render, screen } from '@testing-library/react';
import { Warning } from './index';
import { shallow } from 'enzyme';

describe('Warning Component', () => {
  it('renders with provided text', () => {
    const testText = 'Test Warning Message';
    // const element: ReactElement = <Warning text={testText} />;
    const wrapper = shallow(<Warning text={testText} />);

    expect(wrapper.text()).toContain(testText);
    // If you want to check for the Icon component
    expect(wrapper.find('Icon').exists()).toBe(true);
  });
});