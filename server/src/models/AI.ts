// OpenAI imports
import OpenAI, { AzureOpenAI } from "openai";

// GraphQL imports
import { GraphQLError } from "graphql";

// Operators the generated query is allowed to use, protects against malicious queries
const ALLOWED_OPERATORS = new Set([
  "$and",
  "$or",
  "$nor",
  "$not",
  "$eq",
  "$ne",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$in",
  "$nin",
  "$regex",
  "$options",
  "$elemMatch",
  "$exists",
]);

// Max regex pattern length
const MAX_REGEX_LENGTH = 200;

// Default system prompt to configure the LLM behavior and specify the output format
const SYSTEM_PROMPT = `You translate natural language search requests into MongoDB query JSON for searching research entities.

Return ONLY a valid MongoDB query object as JSON.
Do NOT return explanations, markdown, comments, or additional text.

Assume today's date is {{CURRENT_DATE}} (ISO 8601 format). Use this date when interpreting relative date expressions.

If the input is not a recognizable search request (random characters, gibberish, or meaningless text), return exactly:

null

If the request is ambiguous and cannot be translated without making assumptions, return exactly:

null

## Schema

Only the following fields may be queried. Never invent field names.

- name: string
- created: string (ISO 8601 timestamp)
- description: string
- archived: boolean
- projects: string[] (project IDs)
- relationships[].target.name: string
- attributes[].name: string
- attributes[].values[].type: string
- attributes[].values[].data: string

## Allowed values

attributes.values.type may ONLY be one of:

- text
- number
- entity
- select
- date
- url

## Query rules

- Generate only valid MongoDB query JSON.
- Never invent fields.
- Never invent operators.
- Preserve the user's intent exactly.
- Prefer returning null over guessing.
- Escape any regex metacharacters appearing in user input so searches are literal.
- Use case-insensitive regex matching for text searches.
- Use only the "i" regex option.
- Do not use any other regex flags.
- Use ISO 8601 timestamps for date comparisons.

## Text matching

For partial text matching, use MongoDB's $regex operator with case-insensitive matching.

Examples:

"name contains cancer"

{"name":{"$regex":"/cancer/i"}}

"description mentions climate"

{"description":{"$regex":"/climate/i"}}

## Synonyms

The following words refer to the same fields.

Name:

- name
- named
- called
- titled

→ name

Description:

- description
- describes
- mentions
- contains
- includes

→ description

Relationship:

- related to
- connected to
- linked to
- associated with

→ relationships.target.name

Attribute name:

- attribute
- attribute named
- attribute called

→ attributes.name

Attribute value:

- attribute value
- value
- includes value
- contains value
- equals value

→ attributes.values.data

## Default search

If the user supplies an unqualified search term without specifying a field, search all text fields using $or.

Search these fields:

- name
- description
- relationships.target.name
- attributes.name
- attributes.values.data

Example:

"cancer"

{
  "$or": [
    {"name":{"$regex":"/cancer/i"}},
    {"description":{"$regex":"/cancer/i"}},
    {"relationships.target.name":{"$regex":"/cancer/i"}},
    {"attributes.name":{"$regex":"/cancer/i"}},
    {"attributes.values.data":{"$regex":"/cancer/i"}}
  ]
}

## Dates

Use ISO 8601 timestamps for all date comparisons.

Examples:

"created after January 2024"

{"created":{"$gt":"2024-01-01T00:00:00Z"}}

"created before 2023"

{"created":{"$lt":"2023-01-01T00:00:00Z"}}

"created between 2022 and 2024"

{
  "$and":[
    {"created":{"$gte":"2022-01-01T00:00:00Z"}},
    {"created":{"$lt":"2024-01-01T00:00:00Z"}}
  ]
}

Interpret the following relative date terms as entities created within the last 30 days:

- recent
- recently created
- new
- newly created
- latest

Generate the appropriate ISO 8601 timestamp relative to {{CURRENT_DATE}}.

Example:

"recent entities"

{"created":{"$gte":"<ISO 8601 timestamp representing 30 days before {{CURRENT_DATE}}>"}}

Do not invent meanings for any other relative date terms.

If the user says:

- old
- older
- ancient
- long ago

return null.

## Boolean queries

"archived"

{"archived":true}

"not archived"

{"archived":false}

## Arrays

Check for at least N+1 elements using index existence.

Example:

"multiple attributes"

{"attributes.1":{"$exists":true}}

## Logical operators

Combine multiple required conditions using $and.

Example:

"archived named virus"

{
  "$and":[
    {"archived":true},
    {"name":{"$regex":"/virus/i"}}
  ]
}

Use $or only when:

- the user's wording explicitly implies alternatives (e.g. "A or B"), or
- performing the default unqualified text search.

Operator precedence is:

1. NOT
2. AND
3. OR

Example:

"virus or cancer and archived"

means:

virus OR (cancer AND archived)

## Unsupported requests

Return null for:

- sorting
- aggregations
- statistics
- counts
- averages
- grouping
- unsupported operators
- unknown fields
- ambiguous requests
- impossible requests

## Final rules

- Return ONLY valid MongoDB JSON.
- Return ONLY a JSON object or null.
- Never explain your reasoning.
- Never output markdown.
- Never invent schema fields.
- Never invent operators.
- Never guess.
`;

export class AI {
  /**
   * Recursive function to validate the generated MongoDB query, provide a level of
   * protection against malicious queries
   * @param node Current query node to validate
   * @param depth Current depth of query
   */
  private static validateQuery = (node: unknown, depth = 0): void => {
    if (depth > 20) throw new GraphQLError("Query structure too deeply nested");
    if (node === null || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key.startsWith("$") && !ALLOWED_OPERATORS.has(key)) {
        throw new GraphQLError(`Operator "${key}" is not permitted in AI-generated queries`);
      }
      if (key === "$regex" && typeof value === "string" && value.length > MAX_REGEX_LENGTH) {
        throw new GraphQLError("Regex pattern exceeds maximum allowed length");
      }
      if (Array.isArray(value)) {
        value.forEach((item) => AI.validateQuery(item, depth + 1));
      } else {
        AI.validateQuery(value, depth + 1);
      }
    }
  };

  /**
   * Create and return new client to interact with LLM platform
   * @return {OpenAI | AzureOpenAI}
   */
  private static createClient = (): OpenAI | AzureOpenAI => {
    if (process.env.AI_PROVIDER === "azure") {
      return new AzureOpenAI({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        apiKey: process.env.AZURE_OPENAI_API_KEY!,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01",
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
      });
    }
    return new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY || "lm-studio",
    });
  };

  /**
   * Execute the translation of the natural language string into a valid MongoDB JSON search object
   * @param query Natural language string provided by the user
   * @return {Promise<string>}
   */
  private static isPlausibleQuery = (query: string): boolean => {
    // Must contain at least one run of 2+ letters (rules out "1234", "!@#$", etc.)
    return /[a-zA-Z]{2,}/.test(query.trim());
  };

  /**
   * Suggest CSV column mappings for entity "name" and "description" fields
   * @param columns CSV column names from the uploaded file
   * @return Suggested column names, or null if no confident match
   */
  static suggestColumnMapping = async (
    columns: string[],
  ): Promise<{ name: string | null; description: string | null }> => {
    const client = AI.createClient();
    const model =
      process.env.AI_PROVIDER === "azure"
        ? process.env.AZURE_OPENAI_DEPLOYMENT!
        : process.env.OPENAI_MODEL || "openai/gpt-oss-20b";

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `From these CSV column headers, pick which one best represents an entity name (title/identifier) and which best represents a description. Return ONLY a JSON object — use the exact column string or JSON null:\n{"name":"exact_column_or_null","description":"exact_column_or_null"}\nColumns: ${columns.join(", ")}`,
        },
      ],
      max_tokens: 64,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return { name: null, description: null };

    // Strip markdown code fences if present
    const cleaned = content
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { name: null, description: null };
    }

    // Case-insensitive match against actual column names so the model's
    // casing variations ("Name" vs "name") still resolve correctly.
    const findColumn = (suggestion: unknown): string | null => {
      if (!suggestion || typeof suggestion !== "string") return null;
      return columns.find((c) => c.toLowerCase() === suggestion.toLowerCase()) ?? null;
    };

    return {
      name: findColumn(parsed.name),
      description: findColumn(parsed.description),
    };
  };

  /**
   * Suggest the best-fitting template for a new entity based on its name and description
   * @param name Entity name
   * @param description Entity description
   * @param templates Available templates (id, name, description only)
   * @return {Promise<string | null>} Matched template _id, or null if none fit
   */
  static suggestTemplate = async (
    name: string,
    description: string,
    templates: { _id: string; name: string; description: string }[],
  ): Promise<string | null> => {
    if (templates.length === 0) return null;

    const client = AI.createClient();
    const model =
      process.env.AI_PROVIDER === "azure"
        ? process.env.AZURE_OPENAI_DEPLOYMENT!
        : process.env.OPENAI_MODEL || "openai/gpt-oss-20b";

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a metadata assistant. Given an entity name and description, pick the best-fitting template from the list. Return ONLY the template _id string exactly as given, or null if none fit well.",
        },
        {
          role: "user",
          content: JSON.stringify({
            entity: { name, description },
            templates: templates.map((t) => ({ _id: t._id, name: t.name, description: t.description })),
          }),
        },
      ],
      max_tokens: 64,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content || content === "null") return null;

    // Validate the returned ID is actually one of the provided templates
    const match = templates.find((t) => t._id === content);
    return match ? match._id : null;
  };

  /**
   * Interact with a configured AI provider, passing the system prompt and translating the user-supplied natural
   * language query into a MongoDB-compatible JSON search query. Performs validation of the natural language query
   * and resulting JSON output.
   * @param {string} query User-supplied natural language query
   * @return {string} MongoDB-compatible JSON search query
   */
  static translateSearch = async (query: string): Promise<string> => {
    // Verify that query is plausible
    if (!AI.isPlausibleQuery(query)) {
      throw new GraphQLError("Query does not appear to be a valid search", {
        extensions: { code: "INVALID_QUERY" },
      });
    }

    const client = AI.createClient();
    const model =
      process.env.AI_PROVIDER === "azure"
        ? process.env.AZURE_OPENAI_DEPLOYMENT!
        : process.env.OPENAI_MODEL || "openai/gpt-oss-20b";

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
      max_tokens: 512,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from AI");

    // LLM signals uninterpretable input by returning the literal string "null"
    if (content === "null" || content === null) {
      throw new GraphQLError("Query could not be interpreted as a search", {
        extensions: { code: "UNINTERPRETABLE_QUERY" },
      });
    }

    // Parse and validate before passing to MongoDB
    const parsed = JSON.parse(content);
    AI.validateQuery(parsed);
    return content;
  };
}
