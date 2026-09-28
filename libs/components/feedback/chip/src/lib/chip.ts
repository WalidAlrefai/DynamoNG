import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  chipImageStyles,
  chipRemoveButtonStyles,
  chipStyles,
} from './chip.styles';
import type { DynamoChipPart, DynamoChipVariant } from './chip.types';

@Component({
  selector: 'dg-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip.html',
})
export class DynamoChip extends DynamoBaseComponent<DynamoChipPart> {
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoChipVariant>('solid');
  readonly size = input<DynamoSize>('md');
  readonly removable = input(false);
  readonly removeAriaLabel = input('Remove');
  /** Renders a small circular avatar image ahead of the label — a
   *  dedicated, pre-styled leading visual for a photo/avatar use case,
   *  distinct from the generic `[icon]` projection slot (which has no
   *  styling of its own). Matches PrimeNG's Chip `image` input. */
  readonly image = input<string | undefined>(undefined);
  /** Alt text for `image`. Defaults to `''` (decorative) — the chip's own
   *  projected label content already carries the accessible name; set
   *  this explicitly when the image conveys information the label text
   *  doesn't. */
  readonly imageAlt = input('');
  /** Dims the chip and disables the remove button; the click/keyboard remove path becomes a no-op. */
  readonly disabled = input(false);
  readonly removed = output<void>();

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          chipStyles({
            severity: this.severity(),
            variant: this.variant(),
            size: this.size(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly removeButtonClasses = chipRemoveButtonStyles;
  protected readonly imageClasses = computed(() =>
    chipImageStyles({ size: this.size() }),
  );

  protected remove(): void {
    if (this.disabled()) {
      return;
    }
    this.removed.emit();
  }
}
