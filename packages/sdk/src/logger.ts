import type { LoggerModule } from "i18next";

declare global {
  interface Window {
    setLogLevel: (level: LogLevel) => void;
  }
}

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
  window.setLogLevel = setLogLevel;
}

const canLog = (level: LogLevel) => LOG_LEVELS[getLogLevel()] >= LOG_LEVELS[level];

// biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
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
  // biome-ignore lint/suspicious/noExplicitAny: See above
  error: (...args: any[]) => log("error", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  warn: (...args: any[]) => log("warn", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  info: (...args: any[]) => log("info", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  debug: (...args: any[]) => log("debug", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  trace: (...args: any[]) => log("trace", ...args),
};

export const i18nLogger: LoggerModule = {
  type: "logger",
  // biome-ignore lint/suspicious/noExplicitAny: See above
  error: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("error", `[${caller || "i18next"}] ${message}`);
  },
  // biome-ignore lint/suspicious/noExplicitAny: See above
  warn: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("warn", `[${caller || "i18next"}] ${message}`);
  },
  // biome-ignore lint/suspicious/noExplicitAny: See above
  log: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("info", `[${caller || "i18next"}] ${message}`);
  },
}
