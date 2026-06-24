// Chakra UI imports
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../src/styles/theme";

// Testing imports
import { render as testingRender } from "@testing-library/react";

/**
 * Custom `render` function to ensure that all testable components
 * are correctly wrapped in a `ChakraProvider` instance
 * @param children Components to be tested
 * @return
 */
export const render = (children: React.ReactNode) => {
  return testingRender(<>{children}</>, {
    wrapper: (props: React.PropsWithChildren) => <ChakraProvider value={theme}>{props.children}</ChakraProvider>,
  });
};
