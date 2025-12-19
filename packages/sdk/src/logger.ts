import type { LoggerModule } from "i18next";
import { Mixin, type MixedInCtor } from "@stencil/core";

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
const log = (level: LogLevel, prefix: string, ...args: any[]) => {
  if (canLog(level)) {
    const prefixedArgs = prefix ? [`[${prefix}]`, ...args] : args;
    switch (level) {
      case "error":
        console.error(...prefixedArgs);
        break;
      case "warn":
        console.warn(...prefixedArgs);
        break;
      case "info":
        console.info(...prefixedArgs);
        break;
      case "debug":
        console.debug(...prefixedArgs);
        break;
      case "trace":
        console.trace(...prefixedArgs);
        break;
    }
  }
};

export interface Logger {
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  error: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  warn: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  info: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  debug: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  trace: (...args: any[]) => void;
}

/**
 * Creates a logger instance with a specific prefix (typically class/component name)
 */
export const createLogger = (prefix: string): Logger => ({
  // biome-ignore lint/suspicious/noExplicitAny: See above
  error: (...args: any[]) => log("error", prefix, ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  warn: (...args: any[]) => log("warn", prefix, ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  info: (...args: any[]) => log("info", prefix, ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  debug: (...args: any[]) => log("debug", prefix, ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  trace: (...args: any[]) => log("trace", prefix, ...args),
});

/**
 * Stencil mixin factory that adds a logger property to the component.
 * The logger automatically uses the component's class name as the prefix.
 */
// biome-ignore lint/suspicious/noExplicitAny: if we have no Base we have to invent one
export const loggerFactory = <B extends MixedInCtor>(Base: B = Object as any) => {
  class LoggerMixin extends Base {
    /** @internal */
    __logger: Logger | null = null;

    get logger(): Logger {
      if (!this.__logger) {
        this.__logger = createLogger(this.constructor.name);
      }
      return this.__logger;
    }
  }
  return LoggerMixin;
};

/**
 * Base class for Unidy Stencil components that provides logging functionality.
 * Components extending this class get a `this.logger` property that automatically
 * prefixes log messages with the component's class name.
 *
 * @example
 * ```tsx
 * import { UnidyComponent } from '../logger';
 *
 * @Component({ tag: 'my-component' })
 * export class MyComponent extends UnidyComponent {
 *   componentDidLoad() {
 *     this.logger.debug('Component loaded');
 *   }
 * }
 * ```
 */
export const UnidyComponent = Mixin(loggerFactory);

// Global logger for non-class contexts (backwards compatibility)
export const logger: Logger = {
  // biome-ignore lint/suspicious/noExplicitAny: See above
  error: (...args: any[]) => log("error", "", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  warn: (...args: any[]) => log("warn", "", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  info: (...args: any[]) => log("info", "", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  debug: (...args: any[]) => log("debug", "", ...args),
  // biome-ignore lint/suspicious/noExplicitAny: See above
  trace: (...args: any[]) => log("trace", "", ...args),
};

export const i18nLogger: LoggerModule = {
  type: "logger",
  // biome-ignore lint/suspicious/noExplicitAny: See above
  error: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("error", caller || "i18next", message);
  },
  // biome-ignore lint/suspicious/noExplicitAny: See above
  warn: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("warn", caller || "i18next", message);
  },
  // biome-ignore lint/suspicious/noExplicitAny: See above
  log: (args: any[]) => {
    const [caller_action, ...messages] = args;
    const [caller, action] = caller_action.split(": ");
    const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
    log("info", caller || "i18next", message);
  },
};
