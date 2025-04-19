/* eslint-disable no-console */
/**
 * Logger service for OpenRouter
 * Centralizes logging functionality for the OpenRouter service
 */
export class OpenRouterLogger {
  private static instance: OpenRouterLogger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }

  /**
   * Get singleton instance of the logger
   */
  public static getInstance(): OpenRouterLogger {
    if (!OpenRouterLogger.instance) {
      OpenRouterLogger.instance = new OpenRouterLogger();
    }
    return OpenRouterLogger.instance;
  }

  /**
   * Log error messages
   */
  public error(message: string, error?: unknown): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`[OpenRouter Error] ${this.getTimestamp()} ${message}`, this.redactSensitiveData(error) ?? "");
    }
  }

  /**
   * Log warning messages
   */
  public warn(message: string, data?: unknown): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`[OpenRouter Warning] ${this.getTimestamp()} ${message}`, this.redactSensitiveData(data) ?? "");
    }
  }

  /**
   * Log info messages
   */
  public info(message: string, data?: unknown): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.info(`[OpenRouter Info] ${this.getTimestamp()} ${message}`, this.redactSensitiveData(data) ?? "");
    }
  }

  /**
   * Log debug messages
   */
  public debug(message: string, data?: unknown): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.debug(`[OpenRouter Debug] ${this.getTimestamp()} ${message}`, this.redactSensitiveData(data) ?? "");
    }
  }

  /**
   * Generate timestamp for log entries
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Redact sensitive data from log entries
   * Removes API keys, bearer tokens, and other sensitive information
   */
  private redactSensitiveData(data: unknown): unknown {
    if (!data) return data;

    if (typeof data === "string") {
      // Redact API keys and tokens from strings
      return data
        .replace(/(['"](apiKey|api_key|OPENROUTER_API_KEY)['"]:\s*['"])[^'"]+(['"])/gi, "$1[REDACTED]$3")
        .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
        .replace(/(Authorization:\s+Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
        .replace(/(['"](token|access_token|auth_token|password)['"]:\s*['"])[^'"]+(['"])/gi, "$1[REDACTED]$3");
    }

    if (typeof data === "object" && data !== null) {
      const redactedData = { ...(data as Record<string, unknown>) };

      // Redact sensitive fields in objects
      const sensitiveFields = [
        "apiKey",
        "api_key",
        "OPENROUTER_API_KEY",
        "token",
        "access_token",
        "auth_token",
        "password",
        "secret",
        "Authorization",
      ];

      for (const field of sensitiveFields) {
        if (field in redactedData) {
          redactedData[field] = "[REDACTED]";
        }
      }

      // Handle headers object specially
      if ("headers" in redactedData && typeof redactedData.headers === "object" && redactedData.headers !== null) {
        const headersObj = { ...(redactedData.headers as Record<string, unknown>) };
        for (const field of sensitiveFields) {
          if (field in headersObj) {
            headersObj[field] = "[REDACTED]";
          }
        }
        redactedData.headers = headersObj;
      }

      return redactedData;
    }

    return data;
  }

  /**
   * Get log level from environment variables
   */
  private getLogLevelFromEnv(): LogLevel {
    const logLevel = import.meta.env.OPENROUTER_LOG_LEVEL;
    switch (logLevel?.toLowerCase()) {
      case "silent":
        return LogLevel.SILENT;
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        // Default to INFO level
        return LogLevel.INFO;
    }
  }
}

/**
 * Log levels for the logger
 */
export enum LogLevel {
  SILENT = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

// Export singleton instance
export const logger = OpenRouterLogger.getInstance();
