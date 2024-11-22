// React
import React, { forwardRef } from "react";
import { BeaconRenderProps } from "react-joyride";

// Styling and animation
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

// Beacon animation
const pulse = keyframes`
  0% {
    transform: scale(1);
  }

  55% {
    background-color: rgba(66, 153, 225, 0.9); // Blue 400
    transform: scale(1.6);
  }
`;

// Beacon component styling
const Beacon = styled.span`
  animation: ${pulse} 2s ease-in-out infinite;
  background-color: rgba(49, 130, 206, 0.6); // Blue 500
  border-radius: 50%;
  display: inline-block;
  height: 2.2rem;
  width: 2.2rem;
`;

const WalkthroughBeacon = forwardRef<HTMLButtonElement, BeaconRenderProps>(
  (props, ref) => {
    return <Beacon ref={ref} {...props} />;
  },
);

export default WalkthroughBeacon;
