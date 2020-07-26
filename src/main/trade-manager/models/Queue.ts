/**
 * Define a queue data structure
 */
export class Queue<T> {
  private items: T[];

  constructor() {
    this.items = [];
  }

  /**
   * Add an item to the queue
   * @param item Add this item to the queue
   */
  enqueue(item: T) {
    this.items.push(item);
  }

  /**
   * Remove and return the next item in the queue, if any
   */
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    return this.items.shift();
  }

  /**
   * Define is the queue is empty
   */
  isEmpty(): boolean {
    return this.items.length == 0;
  }
}
