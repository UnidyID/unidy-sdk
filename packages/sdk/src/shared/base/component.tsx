import { getElement, type MixedInCtor, Mixin } from "@stencil/core";
import { createLogger, type Logger } from "../../logger";

// biome-ignore lint/suspicious/noExplicitAny: Mixin factory requires any for Base parameter
export const loggerFactory = <B extends MixedInCtor>(Base: B = Object as any) => {
  class LoggerMixin extends Base {
    /** @internal */
    __logger: Logger | null = null;

    get logger(): Logger {
      if (!this.__logger) {
        this.__logger = createLogger(this.element.localName);
      }
      return this.__logger;
    }

    get element() {
      return getElement(this);
    }
  }
  return LoggerMixin;
};

// biome-ignore lint/suspicious/noExplicitAny: Stencil type is dumb, this is fine
type MixinFactory = <B extends MixedInCtor>(Base?: B) => any;

export type BaseComponentType = ReturnType<typeof loggerFactory>;

/**
 * Base class factory for Unidy Stencil components that provides logging functionality
 * and allows composing additional mixins.
 * Components extending this class get a `this.logger` property that automatically prefixes log messages with the component's class name.
 * Components extending this class get a `this.element` property that automatically
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
 * export class MyComponent extends UnidyComponent(HasSlotFactory) {
 *   // Has both logger and hasSlot functionality
 * }
 * ```
 */
export const UnidyComponent = <T extends MixinFactory[]>(...mixins: T) => {
  return Mixin(loggerFactory, ...mixins);
};
