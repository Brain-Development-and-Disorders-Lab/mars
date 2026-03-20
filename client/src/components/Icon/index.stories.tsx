// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import Icon from "@components/Icon";

// Define the types and metadata for the component
const meta = {
  title: "Components/Icon",
  component: Icon,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    name: "dashboard",
  },
} satisfies Story;

export const Small: Story = {
  args: {
    name: "dashboard",
    size: "sm",
  },
} satisfies Story;

export const Medium: Story = {
  args: {
    name: "dashboard",
    size: "md",
  },
} satisfies Story;

export const Large: Story = {
  args: {
    name: "dashboard",
    size: "lg",
  },
} satisfies Story;

export const Color: Story = {
  args: {
    name: "dashboard",
    color: "red",
  },
} satisfies Story;
