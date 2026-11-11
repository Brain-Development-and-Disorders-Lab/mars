// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// GraphQL imports
import { gql } from "@apollo/client";

// Component import
import TagActor from "@components/TagActor";

const GET_ACTOR_USER = gql`
  query GetActorUser($_id: String) {
    user(_id: $_id) {
      _id
      name
      firstName
      lastName
      image
      account_orcid
      affiliation
      email
    }
  }
`;

const userMock = {
  request: {
    query: GET_ACTOR_USER,
    variables: { _id: "test_user" },
  },
  result: {
    data: {
      user: {
        _id: "test_user",
        name: "Test User",
        firstName: "Test",
        lastName: "User",
        image: "",
        account_orcid: "XXXX-0000-1111-YYYY",
        affiliation: "Washington University in St. Louis",
        email: "test.user@example.com",
      },
    },
  },
};

// Define the types and metadata for the component
const meta = {
  title: "Components/TagActor",
  component: TagActor,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof TagActor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story for "card" presentation, the default
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

// Story for "name" presentation, where only the name is shown
export const Name: Story = {
  parameters: {
    apolloMocks: [userMock],
  },
  args: {
    identifier: "test_user",
    fallback: "Test User",
    size: "sm",
    variant: "name",
  },
} satisfies Story;

// Story for "inline" presentation, a compact avatar and name pill
export const Inline: Story = {
  parameters: {
    apolloMocks: [userMock],
  },
  args: {
    identifier: "test_user",
    fallback: "Test User",
    size: "sm",
    variant: "inline",
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
    variant: "avatar",
  },
} satisfies Story;
