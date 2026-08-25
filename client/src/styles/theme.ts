import { createSystem, defaultConfig } from "@chakra-ui/react";

// Global style configuration and variables
import { STYLES } from "./styles";

/**
 * Converts a STYLES color string ("gray.500") into a Chakra token
 * reference ("{colors.gray.500}")
 * @param {string} value Color value
 * @return {string} Updated `colors.` value for Chakra UI
 */
const toColorRef = (value: string): string =>
  value.startsWith("#") || !value.includes(".") ? value : `{colors.${value}}`;

// Mirrors Chakra's own (unexported) `TokenSchema`/`Recursive<T>` shapes
interface WrappedColors {
  [key: string]: { value: string } | WrappedColors;
}

/**
 * Recursively wraps a STYLES sub-object's string leaves into Chakra's
 * `{ value }` token shape
 * @param {Record<string, unknown>} input Color input structure
 * @return {WrappedColors}
 */
const wrapColors = (input: Record<string, unknown>): WrappedColors =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) =>
      typeof value === "string"
        ? [key, { value: toColorRef(value) }]
        : [key, wrapColors(value as Record<string, unknown>)],
    ),
  );

// The composite keys Chakra's built-in recipes read off `colorPalette.*`
const PALETTE_SLOTS = ["contrast", "fg", "subtle", "muted", "emphasized", "solid", "focusRing", "border"] as const;

/**
 * Aliases every slot of an existing Chakra palette onto a new semantic
 * palette name
 * @param {string} source Color palette source value
 * @return {Record<string, { value: string }>}
 */
const aliasPalette = (source: string): Record<string, { value: string }> =>
  Object.fromEntries(PALETTE_SLOTS.map((slot) => [slot, { value: `{colors.${source}.${slot}}` }]));

/**
 * Builds a `{ default, subtle, emphasized }` status token from an aliased palette family
 * @param {string} palette Color palette name
 * @return {Record<string, { value: string }>}
 */
const statusAlias = (palette: string): Record<string, { value: string }> => ({
  default: { value: `{colors.${palette}.600}` },
  subtle: { value: `{colors.${palette}.100}` },
  emphasized: { value: `{colors.${palette}.700}` },
});

export const theme = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        // Brand identity
        brand: { value: STYLES.brand.navy },
        primary: { value: STYLES.brand.navy },
        navy: { value: STYLES.brand.navy },
        royalBlue: { value: STYLES.brand.royalBlue },
        skyBlue: { value: STYLES.brand.skyBlue },
        brandTeal: { value: STYLES.brand.teal },

        // Color gradient palettes
        gray: {
          50: { value: "#f4f7fb" },
          100: { value: "#d3ddee" },
          200: { value: "#b2c4e1" },
          300: { value: "#90aad4" },
          400: { value: "#6f90c6" },
          500: { value: "#4e77b9" },
          600: { value: "#3d619c" },
          700: { value: "#304d7a" },
          800: { value: "#233859" },
          900: { value: "#162338" },
          950: { value: "#0e1725" },
        },
        red: {
          50: { value: "#fcf2f2" },
          100: { value: "#f6d6d6" },
          200: { value: "#efb9b9" },
          300: { value: "#e99c9c" },
          400: { value: "#e37f7f" },
          500: { value: "#dc6262" },
          600: { value: "#D64545" },
          700: { value: "#b82929" },
          800: { value: "#891e1e" },
          900: { value: "#591414" },
          950: { value: "#2a0909" },
        },
        green: {
          50: { value: "#f2fcf7" },
          100: { value: "#cdf4dd" },
          200: { value: "#a8ecc4" },
          300: { value: "#82e3ab" },
          400: { value: "#5ddb92" },
          500: { value: "#37d379" },
          600: { value: "#28B463" },
          700: { value: "#209150" },
          800: { value: "#196f3d" },
          900: { value: "#114c2a" },
          950: { value: "#092a17" },
        },
        orange: {
          50: { value: "#fdf8f1" },
          100: { value: "#faead3" },
          200: { value: "#f7dcb4" },
          300: { value: "#f3cd96" },
          400: { value: "#f0bf78" },
          500: { value: "#ecb059" },
          600: { value: "#E9A23B" },
          700: { value: "#d08517" },
          800: { value: "#9a6211" },
          900: { value: "#64400b" },
          950: { value: "#2e1d05" },
        },
        blue: {
          50: { value: "#f1f5fe" },
          100: { value: "#d6e2fc" },
          200: { value: "#bbcffa" },
          300: { value: "#a0bcf7" },
          400: { value: "#85a9f5" },
          500: { value: "#6a96f3" },
          600: { value: "#4F83F1" },
          700: { value: "#1358ea" },
          800: { value: "#0e40ac" },
          900: { value: "#09296e" },
          950: { value: "#04122f" },
        },
        teal: {
          50: { value: "#f3fcfa" },
          100: { value: "#d0f4eb" },
          200: { value: "#aeebdd" },
          300: { value: "#8ce3ce" },
          400: { value: "#69dac0" },
          500: { value: "#47d2b1" },
          600: { value: "#2FBF9D" },
          700: { value: "#26997e" },
          800: { value: "#1d745f" },
          900: { value: "#134e40" },
          950: { value: "#0a2922" },
        },
        purple: {
          50: { value: "#f5f2fd" },
          100: { value: "#e3dafa" },
          200: { value: "#d1c2f6" },
          300: { value: "#bfaaf3" },
          400: { value: "#ae93ef" },
          500: { value: "#9c7bec" },
          600: { value: "#8A63E8" },
          700: { value: "#5c26df" },
          800: { value: "#4219a6" },
          900: { value: "#2a1069" },
          950: { value: "#12072c" },
        },
        yellow: {
          50: { value: "#fdf9f2" },
          100: { value: "#f0d9b0" },
          200: { value: "#e4ba6d" },
          300: { value: "#D79A2B" },
          400: { value: "#c08924" },
          500: { value: "#a77720" },
          600: { value: "#8e651b" },
          700: { value: "#765416" },
          800: { value: "#5d4211" },
          900: { value: "#44300d" },
          950: { value: "#2b1f08" },
        },
      },
      fonts: {
        heading: { value: STYLES.fonts.heading },
        body: { value: STYLES.fonts.body },
        mono: { value: STYLES.fonts.mono },
        display: { value: STYLES.fonts.display },
      },
      radii: {
        sm: { value: STYLES.radii.sm },
        md: { value: STYLES.radii.md },
        lg: { value: STYLES.radii.lg },
        full: { value: STYLES.radii.pill },
      },
      durations: {
        fast: { value: STYLES.durations.fast },
        normal: { value: STYLES.durations.normal },
        slow: { value: STYLES.durations.slow },
      },
    },
    semanticTokens: {
      colors: {
        surface: wrapColors(STYLES.surface),
        nav: wrapColors(STYLES.nav),
        text: wrapColors(STYLES.text),
        border: wrapColors({ default: STYLES.border.default, subtle: STYLES.border.subtle }),
        status: {
          danger: statusAlias("red"),
          success: statusAlias("green"),
          warning: statusAlias("orange"),
          info: statusAlias("blue"),
        },
        entity: { ...aliasPalette("blue"), ...wrapColors(STYLES.entity.color) },
        project: { ...aliasPalette("teal"), ...wrapColors(STYLES.project.color) },
        template: { ...aliasPalette("purple"), ...wrapColors(STYLES.template.color) },
        workspace: { ...aliasPalette("yellow"), ...wrapColors(STYLES.workspace.color) },
        relationship: wrapColors(STYLES.relationship),
        graph: wrapColors(STYLES.graph),
        chart: wrapColors(STYLES.chart),
        ai: {
          ...wrapColors(STYLES.ai),
          contrast: { value: "white" },
          fg: { value: toColorRef(STYLES.ai.text) },
          subtle: { value: toColorRef(STYLES.ai.light) },
          muted: { value: toColorRef(STYLES.ai.border) },
          emphasized: { value: toColorRef(STYLES.ai.text) },
          solid: { value: toColorRef(STYLES.ai.default) },
          focusRing: { value: toColorRef(STYLES.ai.default) },
          border: { value: toColorRef(STYLES.ai.border) },
        },
        action: {
          ...wrapColors(STYLES.action),
          contrast: { value: toColorRef(STYLES.action.text) },
          fg: { value: toColorRef(STYLES.action.pressed) },
          subtle: { value: toColorRef(STYLES.action.light) },
          muted: { value: toColorRef(STYLES.action.border) },
          emphasized: { value: toColorRef(STYLES.action.hover) },
          solid: { value: toColorRef(STYLES.action.default) },
          focusRing: { value: toColorRef(STYLES.action.default) },
        },
        table: wrapColors(STYLES.table),
        danger: aliasPalette("red"),
        success: aliasPalette("green"),
        warning: aliasPalette("orange"),
        info: aliasPalette("blue"),
      },
      shadows: {
        sm: { value: STYLES.shadows.sm },
        md: { value: STYLES.shadows.md },
        lg: { value: STYLES.shadows.lg },
      },
    },
    slotRecipes: {
      dialog: {
        base: {
          header: { bg: "surface.emphasized" },
          footer: { bg: "surface.muted" },
        },
        slots: [],
      },
      drawer: {
        base: {
          header: { bg: "surface.emphasized" },
          footer: { bg: "surface.muted" },
        },
        slots: [],
      },
      card: {
        variants: {
          variant: {
            outline: {
              root: { bg: "surface.card", borderColor: "border.default" },
            },
          },
        },
        slots: [],
      },
    },
  },
  globalCss: {
    html: { bg: "surface.subtle" },
  },
});
