// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import TagTimestamp from "@components/TagTimestamp";

// Define the types and metadata for the component
const meta = {
  title: "Components/TagTimestamp",
  component: TagTimestamp,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof TagTimestamp>;

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
