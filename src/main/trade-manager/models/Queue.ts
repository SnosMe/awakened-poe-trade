export class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  enqueue(item: T) {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length == 0;
  }
}
