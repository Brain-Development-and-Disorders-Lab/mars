// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import Loading from "@components/Loading";

// Define the types and metadata for the component
const meta = {
  title: "Components/Loading",
  component: Loading,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {} satisfies Story;
