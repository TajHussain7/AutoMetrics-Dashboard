import pino from "pino";

// Async logger to avoid blocking Node event loop
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export const isDev = process.env.NODE_ENV !== "production";

// Wrapper functions to maintain backward compatibility
export const debug = (...args: any[]) => {
  if (isDev) {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      )
      .join(" ");
    logger.debug(message);
  }
};

export const info = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");
  logger.info(message);
};

export const warn = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");
  logger.warn(message);
};

export const error = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(" ");
  logger.error(message);
};
