import { QueryComponent } from "@types";

import _ from "lodash";

export class QueryEngine {
  static cleanString = (toClean: string): string => {
    let output = toClean.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    output = output.replace(/\\/g, "");
    return output;
  };

  static tokenize = (query: QueryComponent[]): string => {
    return query.toString();
  };
}
