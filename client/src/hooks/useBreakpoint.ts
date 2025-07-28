import { useEffect, useState } from "react";

// Define breakpoints in pixels to match Chakra UI's default breakpoints
const breakpoints = {
  base: 0, // 0px
  sm: 480, // 30em
  md: 768, // 48em
  lg: 992, // 62em
  xl: 1280, // 80em
  "2xl": 1536, // 96em
} as const;

type Breakpoint = keyof typeof breakpoints;

// Create media query strings for each breakpoint
const mediaQueries = Object.entries(breakpoints).reduce(
  (acc, [key, value]) => {
    acc[key as Breakpoint] = `(min-width: ${value}px)`;
    return acc;
  },
  {} as Record<Breakpoint, string>,
);

/**
 * Custom hook that returns the current breakpoint and a function to check if a breakpoint is active
 * @returns {Object} Object containing current breakpoint and isBreakpointActive function
 */
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] =
    useState<Breakpoint>("base");

  useEffect(() => {
    // Function to determine the current breakpoint
    const getCurrentBreakpoint = () => {
      // Check breakpoints from largest to smallest
      const breakpointKeys = Object.keys(breakpoints).reverse() as Breakpoint[];

      for (const breakpoint of breakpointKeys) {
        if (window.matchMedia(mediaQueries[breakpoint]).matches) {
          return breakpoint;
        }
      }
      return "base";
    };

    // Set initial breakpoint
    setCurrentBreakpoint(getCurrentBreakpoint());

    // Create a single resize observer to handle all breakpoint changes
    const handleResize = () => {
      setCurrentBreakpoint(getCurrentBreakpoint());
    };

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Check if a breakpoint is currently active
   * @param breakpoint The breakpoint to check
   * @param comparison Optional comparison operator ('up' or 'down')
   * @returns boolean indicating if the breakpoint condition is met
   */
  const isBreakpointActive = (
    breakpoint: Breakpoint,
    comparison?: "up" | "down",
  ) => {
    const breakpointValue = breakpoints[breakpoint];
    const currentValue = breakpoints[currentBreakpoint];

    if (comparison === "up") {
      return currentValue >= breakpointValue;
    }
    if (comparison === "down") {
      return currentValue <= breakpointValue;
    }
    return currentBreakpoint === breakpoint;
  };

  return {
    breakpoint: currentBreakpoint,
    isBreakpointActive,
    // Helper function to get a responsive value based on breakpoint
    getResponsiveValue: <T>(
      values: Partial<Record<Breakpoint, T>>,
      defaultValue: T,
    ): T => {
      // Check breakpoints from largest to smallest
      const breakpointKeys = Object.keys(breakpoints).reverse() as Breakpoint[];

      for (const bp of breakpointKeys) {
        if (values[bp] !== undefined && isBreakpointActive(bp, "up")) {
          return values[bp]!;
        }
      }
      return defaultValue;
    },
  };
};
