// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// GraphQL imports
import { gql } from "@apollo/client";

// Component import
import AttributeCard from "@components/AttributeCard";

// GraphQL queries required for
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

// Define the types and metadata for the component
const meta = {
  title: "Components/AttributeCard",
  component: AttributeCard,
  parameters: {
    name: "",
  },
} satisfies Meta<typeof AttributeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  parameters: {
    apolloMocks: [
      {
        request: {
          query: GET_USER,
          variables: {
            _id: "test_user",
          },
        },
        result: {
          data: {
            user: {
              _id: "test_user",
              name: "Test User",
              firstName: "Test",
              lastName: "User",
              account_orcid: null,
            },
          },
        },
      },
    ],
  },
  args: {
    _id: "a_test_0",
    name: "Test AttributeCard",
    owner: "test_user",
    description: "test_user",
    values: [],
    restrictDataValues: false,
    archived: false,
    showRemove: false,
    onRemove: () => {},
    onUpdate: () => {},
  },
} satisfies Story;
