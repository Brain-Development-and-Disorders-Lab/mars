import dayjs, { ConfigType, Dayjs } from "dayjs";
import { GraphQLScalarType } from "graphql";

/**
 * Resolver for `Date` scalar type
 */
export const DateResolver = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date type using Dayjs",
    parseValue(value: unknown): Dayjs {
      // Value received from the client, typically a string
      return dayjs(value as ConfigType);
    },
    serialize(value: unknown) {
      // Value sent to the client, formatted for JSON
      return (value as Date | Dayjs).toJSON();
    },
  }),
};
