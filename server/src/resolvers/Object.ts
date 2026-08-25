import { GraphQLScalarType, Kind, ObjectValueNode, ValueNode } from "graphql";

/**
 * Generic GraphQL scalar type to deal with dynamic types rarely used in codebase
 * Credit: https://stackoverflow.com/a/45598911
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toObject = (value: any) => {
  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string" && value.charAt(0) === "{") {
    return JSON.parse(value);
  }

  return value.toString();
};

const parseObject = (ast: ObjectValueNode): Record<string, unknown> => {
  const value: Record<string, unknown> = Object.create(null);
  ast.fields.forEach((field) => {
    value[field.name.value] = parseValue(field.value);
  });

  return value;
};

const parseValue = (ast: ValueNode): unknown => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseValue);
    default:
      return null;
  }
};

export const ObjectResolver = {
  Object: new GraphQLScalarType({
    name: "Object",
    description: "Arbitrary object",
    parseValue: toObject,
    serialize: toObject,
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.STRING:
          return ast.value.charAt(0) === "{" ? JSON.parse(ast.value) : null;
        case Kind.OBJECT:
          return parseObject(ast);
      }
      return null;
    },
  }),
};
