import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Preview } from "@storybook/react";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const mocks = context.parameters.apolloMocks ?? [];
      return (
        <MockedProvider mocks={mocks}>
          <ChakraProvider value={defaultSystem}>
            <Story />
          </ChakraProvider>
        </MockedProvider>
      );
    },
  ],
};

export default preview;
