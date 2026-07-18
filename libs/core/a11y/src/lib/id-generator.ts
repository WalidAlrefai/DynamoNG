import { Injectable } from '@angular/core';

/**
 * Generates unique, DOM-safe ids for wiring `aria-*` attributes (labelledby, describedby,
 * controls, ...) between a component's internal parts without the consumer having to
 * supply an `id` themselves. `providedIn: 'root'` so the counter is shared app-wide and
 * never collides across component instances.
 */
@Injectable({ providedIn: 'root' })
export class DynamoIdGenerator {
  private counter = 0;

  next(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }
}
