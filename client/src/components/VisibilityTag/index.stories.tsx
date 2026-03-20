// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// Component import
import VisibilityTag from "@components/VisibilityTag";

// Define the types and metadata for the component
const meta = {
  title: "Components/VisibilityTag",
  component: VisibilityTag,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof VisibilityTag>;

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
