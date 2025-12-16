import { LoggerModule } from "i18next";

type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

const DEFAULT_LOG_LEVEL: LogLevel = "info";

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 4,
  debug: 3,
  info: 2,
  warn: 1,
  error: 0,
};

const getLogLevel = (): LogLevel => {
  if (typeof window === "undefined") {
    return DEFAULT_LOG_LEVEL;
  }
  return (localStorage.getItem("unidy_log_level") as LogLevel) || DEFAULT_LOG_LEVEL;
};

const setLogLevel = (level: LogLevel) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("unidy_log_level", level);
  }
};

if (typeof window !== "undefined") {
  (window as any).setLogLevel = setLogLevel;
}

const canLog = (level: LogLevel) => LOG_LEVELS[getLogLevel()] >= LOG_LEVELS[level];

const log = (level: LogLevel, ...args: any[]) => {
  if (canLog(level)) {
    switch (level) {
      case "error":
        console.error(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "info":
        console.info(...args);
        break;
      case "debug":
        console.debug(...args);
        break;
      case "trace":
        console.trace(...args);
        break;
    }
  }
};

export const logger = {
  error: (...args: any[]) => log("error", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  info: (...args: any[]) => log("info", ...args),
  debug: (...args: any[]) => log("debug", ...args),
  trace: (...args: any[]) => log("trace", ...args),
};

export const i18nLogger: LoggerModule = {
  type: "logger",
  error: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("error", `[${caller || "i18next"}] ${message}`);
  },
  warn: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("warn", `[${caller || "i18next"}] ${message}`);
  },
  log: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("info", `[${caller || "i18next"}] ${message}`);
  },
}