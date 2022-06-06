// Theme configuration for Grommet
export const theme = {
  global: {
    colors: {
      brand: "#228BE6",
    },
    focus: {
      border: {
        color: "#FFFFFF",
      },
    },
    font: {
      family: "Roboto",
      size: "14px",
      height: "20px",
    },
  },
  anchor: {
    color: "brand",
  },
  card: {
    hover: {
      container: {
        elevation: "large",
      },
    },
    container: {
      elevation: "medium",
      extend: `transition: all 0.2s ease-in-out;`,
    },
    footer: {
      pad: { horizontal: "medium", vertical: "small" },
      background: "#00000008",
    },
  },
};
