import { extendTheme } from "@chakra-ui/react";

// Load the brand typeface
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

// Brand and semantic colors, matching the application's design system
export const theme = extendTheme({
  colors: {
    brand: {
      navy: "#0E2146",
      royalBlue: "#4F83F1",
      skyBlue: "#6CC7F5",
      teal: "#47D1BE",
    },
    ai: {
      default: "#6F5EF9",
      text: "#5947E8",
      light: "#F3F0FF",
      border: "#CFC5FF",
    },
    text: {
      default: "#162338",
      muted: "#5E6E84",
      subtle: "#8D99A8",
      faint: "#A8B3C2",
    },
    border: {
      default: "#DCE3EC",
      subtle: "#EEF4FA",
    },
    surface: {
      subtle: "#F7F9FC",
      muted: "#F3F6FA",
    },
    blue: {
      50: "#f1f5fe",
      100: "#d6e2fc",
      200: "#bbcffa",
      300: "#a0bcf7",
      400: "#85a9f5",
      500: "#6a96f3",
      600: "#4F83F1",
      700: "#1358ea",
      800: "#0e40ac",
      900: "#09296e",
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  shadows: {
    card: "0 1px 3px rgba(14, 33, 70, 0.06)",
    cardHover: "0 12px 28px rgba(14, 33, 70, 0.12)",
    glow: "0 8px 24px rgba(79, 131, 241, 0.35)",
  },
});
