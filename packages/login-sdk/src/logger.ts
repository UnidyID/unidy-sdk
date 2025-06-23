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
}
