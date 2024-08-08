import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql";

/**
 * Generic GraphQL scalar type to deal with dynamic types rarely used in codebase
 * Credit: https://stackoverflow.com/a/47880926
 */
export const ObjectResolver = {
  Object: new GraphQLScalarType({
    name: "Object",
    description: "Arbitrary object",
    parseValue: (value: any) => {
      // Value received from the client, typically a string
      return typeof value === "object"
        ? JSON.stringify(value)
        : typeof value === "string"
          ? value
          : value;
    },
    serialize: (value: any) => {
      // Value sent to the client, formatted for JSON
      if (typeof value === "string") {
        // Attempt to parse as JSON, else continue
        try {
          let parsedValue = JSON.parse(value);
          return parsedValue;
        } catch (error) {}
      }
      return typeof value === "object"
        ? JSON.parse(value)
        : typeof value === "string"
          ? value
          : value;
    },
    parseLiteral: (ast: any) => {
      switch (ast.kind) {
        case Kind.STRING:
          return JSON.parse(ast.value);
        case Kind.OBJECT:
          throw new Error(
            "Not sure what to do with OBJECT for Object scalar type",
          );
        default:
          return ast.value;
      }
    },
  }),
};
