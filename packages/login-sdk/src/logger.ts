export class Logger {
  enabled: boolean;
  prefix: string;

  constructor(enabled = true, prefix = "[Unidy Auth]") {
    this.enabled = enabled;
    this.prefix = prefix;
  }

  log(...args: unknown[]) {
    if (this.enabled) {
      console.log(`%c${this.prefix}`, "color: blue; font-weight: bold", ...args);
    }
  }

  error(...args: unknown[]) {
    if (this.enabled) {
      console.error(`%c${this.prefix}`, "color: red; font-weight: bold", ...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.enabled) {
      console.warn(`%c${this.prefix}`, "color: orange; font-weight: bold", ...args);
    }
  }
}
