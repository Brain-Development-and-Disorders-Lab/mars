import { QueryFocusType, QueryOperator, QueryParameters, QueryToken } from "@types";

export const TOKENS: QueryToken[] = ["&", "|", "!", "="];
export const OPERATORS: QueryOperator[] = ["AND", "OR", "NOT", "INCLUDES"];
export const PARAMETERS: QueryParameters[] = ["NAME", "CREATED", "OWNER"];
export const FOCUS_TYPES: QueryFocusType[] = ["ENTITY", "COLLECTION", "ATTRIBUTE"];
