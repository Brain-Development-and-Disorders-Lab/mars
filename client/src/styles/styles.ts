/**
 * Canonical design tokens for the application, based on the Metadatify
 * design system (brand navy/blue/sky/teal, light-theme-only). Chakra's theme
 * (see `theme.ts`) is generated from this object, so changing a value here
 * propagates to both the Chakra theme and any component that references
 * STYLES directly.
 */
export const STYLES = {
  font: {
    secondaryHeader: {
      color: "gray.600",
    },
  },
  brand: {
    navy: "#0E2146",
    royalBlue: "#4F83F1",
    skyBlue: "#6CC7F5",
    teal: "#47D1BE",
    white: "#FFFFFF",
  },
  neutral: {
    background: "#F7F9FC",
    card: "#FFFFFF",
    sidebar: "#F3F6FA",
    border: "#DCE3EC",
    hover: "#EEF4FA",
    textPrimary: "#162338",
    textSecondary: "#5E6E84",
    textTertiary: "#8D99A8",
    disabled: "#A8B3C2",
  },
  border: {
    style: "1px solid",
    color: "#DCE3EC",
    default: "#DCE3EC",
    subtle: "#EEF4FA",
  },
  card: {
    bg: "#FFFFFF",
  },
  dialog: {
    header: {
      bg: "#F3F6FA",
    },
    footer: {
      bg: "#F7F9FC",
    },
  },
  entity: {
    color: {
      default: "#4F83F1",
      light: "#EAF2FF",
      dark: "#2B5FCE",
      border: "#BCD2FF",
      icon: "#4F83F1",
    },
  },
  project: {
    color: {
      default: "#2FBF9D",
      light: "#E8F8F3",
      dark: "#1C8D74",
      border: "#A7E7D7",
      icon: "#2FBF9D",
    },
  },
  template: {
    color: {
      default: "#8A63E8",
      light: "#F2ECFF",
      dark: "#6848BF",
      border: "#D9C8FF",
      icon: "#8A63E8",
    },
  },
  workspace: {
    color: {
      default: "#D79A2B",
      light: "#FFF7E8",
      dark: "#A87313",
      border: "#F2D79B",
      icon: "#D79A2B",
    },
  },
  ai: {
    default: "#6F5EF9",
    secondary: "#4FC8FF",
    light: "#F3F0FF",
    border: "#CFC5FF",
    text: "#5947E8",
  },
  action: {
    default: "#00A88F",
    hover: "#008F79",
    pressed: "#007564",
    light: "#E7FBF7",
    border: "#A7E8DA",
    text: "#FFFFFF",
  },
  surface: {
    canvas: "#F7F9FC",
    card: "#FFFFFF",
    sidebar: "#F3F6FA",
    subtle: "#F7F9FC",
    muted: "#F3F6FA",
    emphasized: "#EEF4FA",
  },
  nav: {
    bg: "#0E2146",
    hoverBg: "#1D3A72",
    text: "#FFFFFF",
    textMuted: "#9FB0CC",
    hover: "white/10",
    active: "white/16",
  },
  text: {
    default: "#162338",
    muted: "#5E6E84",
    subtle: "#8D99A8",
    faint: "#A8B3C2",
  },
  status: {
    danger: {
      default: "#D64545",
    },
    success: {
      default: "#28B463",
    },
    warning: {
      default: "#E9A23B",
    },
    info: {
      default: "#4F83F1",
    },
  },
  relationship: {
    parent: "#4F83F1",
    child: "#2FBF9D",
    general: "#8A63E8",
  },
  graph: {
    primary: "#47D1BE",
    secondary: "#A8B3C2",
    primaryBg: "#E7FBF7",
    canvasDot: "#aaaaaa",
  },
  chart: {
    axis: "#52525b",
    grid: "#cccccc",
    line: "#4F83F1",
  },
  table: {
    headerBg: "#F3F6FA",
    headerText: "#162338",
    border: "#DCE3EC",
    rowHover: "#F8FAFD",
    selectedRow: "#EAF2FF",
    stripedRow: "#FCFDFE",
    activeSort: "#4F83F1",
  },
  radii: {
    sm: "6px",
    md: "8px",
    lg: "10px",
    pill: "999px",
  },
  shadows: {
    sm: "0 1px 3px rgba(15,23,42,.05)",
    md: "0 6px 18px rgba(15,23,42,.08)",
    lg: "0 12px 28px rgba(15,23,42,.10)",
  },
  durations: {
    fast: "120ms",
    normal: "180ms",
    slow: "250ms",
  },
  easing: "ease-out",
  fonts: {
    body: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
    display: "'Plus Jakarta Sans', sans-serif",
  },
};
