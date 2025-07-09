import { createSystem, defaultConfig } from "@chakra-ui/react";

export const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: { value: "#2E3192" },
        primary: { value: "#2E3192" },
        secondary: { value: "#1B98E0" },
        background: { value: "#FFFFFF" },
        "accent-1": { value: "#419D78" },
        "accent-2": { value: "#F78E69" },
      },
    },
  },
});
