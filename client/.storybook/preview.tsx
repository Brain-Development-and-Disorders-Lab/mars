// Storybook imports
import type { Preview } from "@storybook/react";

// Chakra UI imports
import { Box, ChakraProvider, defaultSystem } from "@chakra-ui/react";

// Apollo `MockedProvider` required for components using GraphQL
import { MockedProvider } from "@apollo/client/testing/react";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const mocks = context.parameters.apolloMocks ?? [];
      return (
        <MockedProvider mocks={mocks}>
          <ChakraProvider value={defaultSystem}>
            <Box w={"80%"}>
              <Story />
            </Box>
          </ChakraProvider>
        </MockedProvider>
      );
    },
  ],
};

export default preview;
