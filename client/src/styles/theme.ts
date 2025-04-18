import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  styles: {
    global: () => ({
      body: {
        minH: "100vh",
      },
    }),
  },
  colors: {
    brand: "#2E3192",
    primary: "#2E3192",
    secondary: "#1B98E0",
    background: "#FFFFFF",
    "accent-1": "#419D78",
    "accent-2": "#F78E69",
  },
});
