// Centralized Logger for the API
// Log levels: ERROR = 0, WARN = 1, INFO = 2, DEBUG = 3, LOG = 4

import { config } from "@/config/config";

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  LOG: 4,
} as const;

export type LogLevelName = keyof typeof LOG_LEVELS;
export type LogLevelValue = typeof LOG_LEVELS[LogLevelName];

const getDefaultLogLevel = (): LogLevelValue => {
  const envLogLevel = config.logLevel.toUpperCase();
  if (envLogLevel && envLogLevel in LOG_LEVELS) {
    return LOG_LEVELS[envLogLevel as LogLevelName];
  }
  return config.isProduction ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
};

// Module-level private state to allow dynamic updates even if the instance is frozen
let isLoggingDisabled = !config.enableLogging;
let currentLogLevel: LogLevelValue = getDefaultLogLevel();

const ANSI_COLORS = {
  RESET: "\x1b[0m",
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m",  // Yellow
  INFO: "\x1b[32m",  // Green
  DEBUG: "\x1b[36m", // Cyan
  LOG: "\x1b[90m",   // Gray
} as const;

class Logger {
  private context: string;

  constructor(context: string = "") {
    this.context = context;
  }

  public child(context?: string): Logger {
    if (context) {
      return new Logger(context);
    }

    // Capture the stack trace exactly once when the child logger is created (zero impact on log calls)
    const stack = new Error().stack;
    if (stack) {
      const projectRoot = process.cwd();
      const lines = stack.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (
          line.includes("at ") &&
          !line.includes("logger.ts") &&
          !line.includes("logger.js") &&
          !line.includes("node_modules")
        ) {
          const match = line.match(/\((.*)\)/) || line.match(/at\s+(.*)/);
          if (match) {
            const pathWithCoords = match[1]; // ej: "/path/to/src/lib/admin-init.ts:7:22"
            const parts = pathWithCoords.split(":");
            if (parts.length >= 2) {
              let filePath = parts[0];
              filePath = filePath.split("?")[0].split("#")[0]; // Clean query/hash

              // Extract project-relative path (e.g. "src/lib/admin-init.ts")
              if (filePath.startsWith(projectRoot)) {
                filePath = filePath.slice(projectRoot.length);
                // Remove leading slash
                if (filePath.startsWith("/") || filePath.startsWith("\\")) {
                  filePath = filePath.slice(1);
                }
              }

              return new Logger(filePath || "unknown");
            }
          }
        }
      }
    }

    return new Logger("unknown");
  }

  public setLoggingDisabled(disabled: boolean): void {
    isLoggingDisabled = disabled;
  }

  public setLogLevel(level: LogLevelValue): void {
    currentLogLevel = level;
  }

  private shouldLog(level: LogLevelValue): boolean {
    return !isLoggingDisabled && level <= currentLogLevel;
  }

  private formatMessage(level: LogLevelValue, message: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19); // YYYY-MM-DD HH:MM:SS
    const levelStr = ((Object.keys(LOG_LEVELS) as LogLevelName[]).find(
      (key) => LOG_LEVELS[key] === level
    ) || "UNKNOWN") as keyof typeof ANSI_COLORS;
    
    const color = ANSI_COLORS[levelStr] || ANSI_COLORS.RESET;
    const contextStr = this.context ? ` ${ANSI_COLORS.LOG}[${this.context}]${ANSI_COLORS.RESET}` : "";
    return `[${timestamp}] ${color}[${levelStr}]${ANSI_COLORS.RESET}${contextStr} ${message}`;
  }

  public error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, message), ...args);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message), ...args);
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(this.formatMessage(LOG_LEVELS.INFO, message), ...args);
    }
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message), ...args);
    }
  }

  public log(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.LOG)) {
      console.log(this.formatMessage(LOG_LEVELS.LOG, message), ...args);
    }
  }
}

const instance = new Logger();
// Ensure the singleton instance is frozen to prevent modification
Object.freeze(instance);

export default instance;
