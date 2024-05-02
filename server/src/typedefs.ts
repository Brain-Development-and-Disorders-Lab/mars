/**
 * GraphQL type definitions
 */
export const typedefs = `#graphql
  # "User" type
  type User {
    _id: String
    name: String
    email: String
    id_token: String
  }

  # Define query types
  type Query {
    users: [User]
    user(_id: String): User
  }
`;
