import { ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from '@angular/cdk/a11y';
import { Injectable, inject } from '@angular/core';

/**
 * Thin wrapper around the CDK's `ConfigurableFocusTrapFactory`, kept as DynamoNG's own
 * injectable so overlay components (dialog, ...) depend on a DynamoNG abstraction rather
 * than importing `@angular/cdk/a11y` directly everywhere it's needed.
 */
@Injectable({ providedIn: 'root' })
export class DynamoFocusTrapService {
  private readonly cdkFactory = inject(ConfigurableFocusTrapFactory);

  /** Creates and immediately activates a focus trap scoped to `element`. */
  create(element: HTMLElement): ConfigurableFocusTrap {
    const trap = this.cdkFactory.create(element);
    void trap.focusInitialElementWhenReady();
    return trap;
  }
}
