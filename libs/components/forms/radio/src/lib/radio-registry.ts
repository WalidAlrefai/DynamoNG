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
        other.isFormsControlled()
      ) {
        other.writeValue(radio.value());
      }
    }
  }
}
