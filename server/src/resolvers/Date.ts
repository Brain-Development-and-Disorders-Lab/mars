import dayjs, { Dayjs } from "dayjs";
import { GraphQLScalarType } from "graphql";

/**
 * Resolver for `Date` scalar type
 */
export const DateResolver = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date type using Dayjs",
    parseValue(value: any): Dayjs {
      // Value received from the client, typically a string
      return dayjs(value);
    },
    serialize(value: any) {
      // Value sent to the client, formatted for JSON
      return value.toJSON();
    }
  }),
};
