// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// GraphQL imports
import { gql } from "@apollo/client";

// Component import
import ActorTag from "@components/ActorTag";

const GET_USER = gql`
  query GetUser($_id: String) {
    user(_id: $_id) {
      _id
      name
      firstName
      lastName
      account_orcid
    }
  }
`;

const userMock = {
  request: {
    query: GET_USER,
    variables: { _id: "test_user" },
  },
  result: {
    data: {
      user: {
        _id: "test_user",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        account_orcid: "XXXX-0000-1111-YYYY",
      },
    },
  },
};

// Define the types and metadata for the component
const meta = {
  title: "Components/ActorTag",
  component: ActorTag,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof ActorTag>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story for "default" presentation
export const Default: Story = {
  parameters: {
    apolloMocks: [userMock],
  },
  args: {
    identifier: "test_user",
    fallback: "Test User",
    size: "sm",
  },
} satisfies Story;

// Story for "inline" presentation, where the avatar is shrunk and text is constrained
export const Inline: Story = {
  parameters: {
    apolloMocks: [userMock],
  },
  args: {
    identifier: "test_user",
    fallback: "Test User",
    size: "sm",
    inline: true,
  },
} satisfies Story;

// Story for "avatar-only" presentation, where the name and ORCiD are not shown
export const AvatarOnly: Story = {
  parameters: {
    apolloMocks: [userMock],
  },
  args: {
    identifier: "test_user",
    fallback: "Test User",
    size: "sm",
    avatarOnly: true,
  },
} satisfies Story;
