export class Logger {
  enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  log(...args: unknown[]) {
    if (this.enabled) {
      console.log("[Unidy Auth]", ...args);
    }
  }

  error(...args: unknown[]) {
    if (this.enabled) {
      console.error("[Unidy Auth]", ...args);
    }
  }
}
