class StorageMock implements Storage {
  private store: Record<string, string> = {};

  get length() {
    return Object.keys(this.store).length;
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return Object.hasOwn(this.store, key) ? this.store[key] : null;
  }

  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

Object.defineProperty(global, "localStorage", { value: new StorageMock(), writable: true });
Object.defineProperty(global, "sessionStorage", { value: new StorageMock(), writable: true });
