import { Injectable } from '@angular/core';
import type { DynamoRadio } from './radio';

/**
 * Mirrors Angular's own built-in `RadioControlRegistry`: a native
 * `<input type="radio">` never fires `change` on a sibling that becomes
 * deselected because a different radio sharing its `name` was checked, so
 * when multiple `DynamoRadio`s are wired up via `ControlValueAccessor`
 * (`formControlName`/`[(ngModel)]`) — even against the *same* control —
 * nothing else tells the sibling accessors to update their own `checked`
 * state. `select()` re-runs every other same-`name` radio's own
 * `writeValue()` against the newly-selected value so each recomputes
 * `checked` for itself, exactly like Angular's `fireUncheck`.
 */
@Injectable({ providedIn: 'root' })
export class DynamoRadioControlRegistry {
  private readonly radios = new Set<DynamoRadio>();

  add(radio: DynamoRadio): void {
    this.radios.add(radio);
  }

  remove(radio: DynamoRadio): void {
    this.radios.delete(radio);
  }

  select(radio: DynamoRadio): void {
    for (const other of this.radios) {
      if (
        other !== radio &&
        other.name() === radio.name() &&
        other.isFormsControlled() &&
        this.isSameGroup(other, radio)
      ) {
        other.writeValue(radio.value());
      }
    }
  }

  /**
   * Mirrors Angular's own `RadioControlRegistry._isSameGroup`: when *both*
   * radios resolve a form root (i.e. each is bound via `formControlName`/
   * `[formControl]`/`[(ngModel)]` directly on its own host element), they
   * must share the same root to be considered the same group — this is what
   * stops two unrelated reactive-forms radio groups elsewhere in the app
   * that happen to reuse the same `name` from cross-contaminating each
   * other's selection. If either side resolves no root at all (the plain
   * split-binding pattern has no `NgControl`), fall back to the original
   * name-only match so that usage is unaffected.
   */
  private isSameGroup(a: DynamoRadio, b: DynamoRadio): boolean {
    const rootA = a.formRoot();
    const rootB = b.formRoot();
    if (!rootA || !rootB) return true;
    return rootA === rootB;
  }
}
