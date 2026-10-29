import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Skip the pretty transport under Jest
const isTest = process.env.JEST_WORKER_ID !== undefined;
const prettyTransport = { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } };

/**
 * Configure new logger using `pino`
 */
export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev && !isTest ? prettyTransport : undefined,
  redact: {
    paths: ["req.headers.authorization", 'req.headers["api_key"]', "req.headers.cookie"],
    censor: "[REDACTED]",
  },
  base: { env: process.env.NODE_ENV },
});
