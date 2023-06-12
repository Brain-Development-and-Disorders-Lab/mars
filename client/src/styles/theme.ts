import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  styles: {
    global: () => ({
      body: {
        minH: "100vh",
        background: "gray.50"
      },
    }),
  },
});
