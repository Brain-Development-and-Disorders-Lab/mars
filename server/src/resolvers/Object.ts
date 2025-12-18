import { GraphQLScalarType, Kind } from "graphql";

/**
 * Generic GraphQL scalar type to deal with dynamic types rarely used in codebase
 * Credit: https://stackoverflow.com/a/45598911
 */
const toObject = (value: any) => {
  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string" && value.charAt(0) === "{") {
    return JSON.parse(value);
  }

  return value.toString();
};

const parseObject = (ast: any) => {
  const value = Object.create(null);
  ast.fields.forEach((field: any) => {
    value[field.name.value] = parseValue(field.value);
  });

  return value;
};

const parseValue = (ast: any) => {
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
