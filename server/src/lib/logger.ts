import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Configure new logger using `pino`
 */
export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } } : undefined,
  redact: {
    paths: ["req.headers.authorization", 'req.headers["api_key"]', "req.headers.cookie"],
    censor: "[REDACTED]",
  },
  base: { env: process.env.NODE_ENV },
});
