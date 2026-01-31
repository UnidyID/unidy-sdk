import { type MixedInCtor, Mixin } from "@stencil/core";
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
const log = (level: LogLevel, prefix: string, ...args: any[]) => {
  if (canLog(level)) {
    const prefixedArgs = prefix ? [`[${prefix}]`, ...args] : args;
    console[level](...prefixedArgs);
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

const LOG_METHODS: LogLevel[] = ["error", "warn", "info", "debug", "trace"];

/**
 * Creates a logger instance with a specific prefix (typically class/component name)
 */
export const createLogger = (prefix: string): Logger => {
  return LOG_METHODS.reduce((logger, level) => {
    // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
    logger[level] = (...args: any[]) => log(level, prefix, ...args);
    return logger;
  }, {} as Logger);
};

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

// biome-ignore lint/suspicious/noExplicitAny: Mixin factory types require any
type MixinFactory = <B extends MixedInCtor>(Base?: B) => any;

/**
 * Interface for the logger functionality provided by UnidyComponent mixin.
 */
export interface WithLogger {
  logger: Logger;
}

/**
 * Base class factory for Unidy Stencil components that provides logging functionality
 * and allows composing additional mixins.
 * Components extending this class get a `this.logger` property that automatically
 * prefixes log messages with the component's class name.
 *
 * @example
 * ```tsx
 * import { UnidyComponent } from '../logger';
 *
 * // Basic usage (logger only)
 * @Component({ tag: 'my-component' })
 * export class MyComponent extends UnidyComponent() {
 *   componentDidLoad() {
 *     this.logger.debug('Component loaded');
 *   }
 * }
 *
 * // With additional mixins
 * @Component({ tag: 'my-component' })
 * export class MyComponent extends UnidyComponent(hasSlotFactory, otherMixin) {
 *   // Has both logger and hasSlot functionality
 * }
 * ```
 */
export const UnidyComponent = <T extends MixinFactory[]>(...mixins: T): MixedInCtor<WithLogger> => {
  return Mixin(loggerFactory, ...mixins) as unknown as MixedInCtor<WithLogger>;
};

// Global logger for non-class contexts (backwards compatibility)
export const logger = createLogger("");

// biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
const formatI18nMessage = (args: any[]): { prefix: string; message: string } => {
  const [caller_action, ...messages] = args;
  const [caller, action] = caller_action.split(": ");
  const message = typeof messages[0] === "object" ? action : `${action}: ${messages.join(" ")}`;
  return { prefix: caller || "i18next", message };
};

export const i18nLogger: LoggerModule = {
  type: "logger",
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  error: (args: any[]) => {
    const { prefix, message } = formatI18nMessage(args);
    log("error", prefix, message);
  },
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  warn: (args: any[]) => {
    const { prefix, message } = formatI18nMessage(args);
    log("warn", prefix, message);
  },
  // biome-ignore lint/suspicious/noExplicitAny: External interfaces require the use of any in this case
  log: (args: any[]) => {
    const { prefix, message } = formatI18nMessage(args);
    log("info", prefix, message);
  },
};
