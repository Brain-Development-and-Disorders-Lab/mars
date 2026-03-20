// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import TimestampTag from "@components/TimestampTag";

// Define the types and metadata for the component
const meta = {
  title: "Components/TimestampTag",
  component: TimestampTag,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof TimestampTag>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    timestamp: "2026-03-20",
  },
} satisfies Story;

export const WithDescription: Story = {
  args: {
    timestamp: "2026-03-20",
    description: "Created",
  },
} satisfies Story;

export const NoTimestamp: Story = {
  args: {
    timestamp: "",
  },
} satisfies Story;
