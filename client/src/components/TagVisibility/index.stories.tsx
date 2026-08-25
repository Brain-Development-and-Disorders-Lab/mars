// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import TagVisibility from "@components/TagVisibility";

// Define the types and metadata for the component
const meta = {
  title: "Components/TagVisibility",
  component: TagVisibility,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof TagVisibility>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Public: Story = {
  args: {
    isPublic: true,
    setIsPublic: () => {},
  },
} satisfies Story;

export const Private: Story = {
  args: {
    isPublic: false,
    setIsPublic: () => {},
  },
} satisfies Story;

export const Disabled: Story = {
  args: {
    isPublic: true,
    setIsPublic: () => {},
    disabled: true,
  },
} satisfies Story;

export const Inherited: Story = {
  args: {
    isPublic: true,
    isInherited: true,
  },
} satisfies Story;
