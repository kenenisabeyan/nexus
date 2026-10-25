// Structured JSON Logger for Nexus API
// Outputs ISO timestamped, correlation-indexed structured JSON logs for production observability.

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: string;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>, requestId?: string, error?: Error | unknown): string {
  const logObj: LogMessage = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId ? { requestId } : {}),
    ...(context ? { context } : {}),
    ...(error ? { error: error instanceof Error ? error.stack || error.message : String(error) } : {}),
  };
  return JSON.stringify(logObj);
}

export const logger = {
  log(level: LogLevel, message: string, context?: Record<string, unknown>, requestId?: string, error?: Error | unknown) {
    const logStr = formatLog(level, message, context, requestId, error);
    if (level === "error") console.error(logStr);
    else if (level === "warn") console.warn(logStr);
    else if (level === "debug") {
      if (process.env.NODE_ENV !== "production" && process.env.LOG_LEVEL === "debug") {
        console.log(logStr);
      }
    } else console.log(logStr);
  },
  debug(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log("debug", message, context, requestId);
  },
  info(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log("info", message, context, requestId);
  },
  warn(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log("warn", message, context, requestId);
  },
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>, requestId?: string) {
    this.log("error", message, context, requestId, error);
  },
};
