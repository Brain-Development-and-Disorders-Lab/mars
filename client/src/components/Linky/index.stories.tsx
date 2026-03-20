// Storybook imports
import type { Meta, StoryObj } from "@storybook/react-webpack5";

// GraphQL imports
import { gql } from "@apollo/client";

// Component import
import Linky from "@components/Linky";

// Routing
import React from "react";
import { MemoryRouter } from "react-router-dom";

const GET_ENTITY = gql`
  query GetEntity($_id: String) {
    entity(_id: $_id) {
      _id
      name
      archived
    }
  }
`;

const GET_PROJECT = gql`
  query GetProject($_id: String) {
    project(_id: $_id) {
      _id
      name
    }
  }
`;

// Define the types and metadata for the component
const meta = {
  title: "Components/Linky",
  component: Linky,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    name: "",
  },
} satisfies Meta<typeof Linky>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Entity: Story = {
  parameters: {
    apolloMocks: [
      {
        request: {
          query: GET_ENTITY,
          variables: { _id: "e_test_00" },
        },
        result: {
          data: {
            entity: { _id: "e_test_00", name: "Test Entity", archived: false },
          },
        },
      },
    ],
  },
  args: {
    type: "entities",
    id: "e_test_00",
    fallback: "Test Entity",
  },
} satisfies Story;

export const Project: Story = {
  parameters: {
    apolloMocks: [
      {
        request: {
          query: GET_PROJECT,
          variables: { _id: "p_test_00" },
        },
        result: {
          data: {
            project: { _id: "p_test_00", name: "Test Project" },
          },
        },
      },
    ],
  },
  args: {
    type: "projects",
    id: "p_test_00",
    fallback: "Test Project",
  },
} satisfies Story;

export const Deleted: Story = {
  parameters: {
    apolloMocks: [],
  },
  args: {
    type: "entities",
    id: "",
    fallback: "Deleted Entity",
  },
} satisfies Story;
