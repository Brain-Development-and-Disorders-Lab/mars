import { Query } from "@types";
import { OPERATORS } from "./constants";

import _ from "lodash";
import { consola } from "consola";

export class QueryEngine {
  static cleanString = (toClean: string): string => {
    let output = toClean.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    output = output.replace(/\\/g, "");
    return output;
  };

  static tokenize = (query: Query): Query => {
    let sanitized = this.cleanString(query.raw);
    let tokens = sanitized.split(" ");

    for (let token of tokens) {
      if (_.includes(OPERATORS, token)) {
        consola.info("Found a token:", token);
      }
    }

    query.tokens = tokens;
    return query;
  }
};
