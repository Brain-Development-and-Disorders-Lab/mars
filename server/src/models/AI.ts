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

const SYSTEM_PROMPT = `Translate natural language to a MongoDB JSON query for searching research entities. Return ONLY valid JSON, no explanation, no markdown.
If the input is not a recognizable search query (e.g. gibberish, random characters, or meaningless text), return exactly: null

Entity schema:
- name: string (entity name)
- description: string
- relationships[].target.name: string (names of related entities)
- attributes[].values[].data: string (attribute values)

Use regex for text matching: {"field":{"$regex":"/term/gi"}}
Combine with: {"$and":[cond1,cond2]}

Examples:
"named cancer" → {"name":{"$regex":"/cancer/gi"}}
"description mentions climate" → {"description":{"$regex":"/climate/gi"}}
"related to John Smith" → {"relationships.target.name":{"$regex":"/John Smith/gi"}}
"has attribute value 42" → {"attributes.values.data":{"$regex":"/42/gi"}}
"named cancer related to mouse" → {"$and":[{"name":{"$regex":"/cancer/gi"}},{"relationships.target.name":{"$regex":"/mouse/gi"}}]}`;

export class AI {
  /**
   * Recursive function to validate the generated MongoDB query, provide a level of
   * protection against malicious queries
   * @param node Current query node to validate
   * @param depth Current depth of query
   * @return
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
  // Minimum word-like tokens required before spending a token on the LLM.
  // Rejects pure gibberish strings that contain no recognisable words.
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

  static translateSearch = async (query: string): Promise<string> => {
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
    if (content === "null") {
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
