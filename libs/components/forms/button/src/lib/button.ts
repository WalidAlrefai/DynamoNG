import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoSpinner } from '@dynamong/spinner';
import { cn } from '@dynamong/utils/class-merge';
import { buttonStyles } from './button.styles';
import type {
  DynamoButtonIconPos,
  DynamoButtonPart,
  DynamoButtonSeverity,
  DynamoButtonSize,
  DynamoButtonType,
  DynamoButtonVariant,
} from './button.types';

@Component({
  selector: 'dg-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpinner, DynamoPassThroughDirective],
  templateUrl: './button.html',
})
export class DynamoButton extends DynamoBaseComponent<DynamoButtonPart> {
  readonly severity = input<DynamoButtonSeverity>('primary');
  readonly size = input<DynamoButtonSize>('md');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly type = input<DynamoButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  /** Stretches the button to fill its container's width — `w-full` instead of the default `inline-flex` sizing. */
  readonly fullWidth = input(false);
  /** Adds a shadow. Composes with any `variant`, including `text`/`link` (PrimeNG's "Raised Text"). */
  readonly raised = input(false);
  /** Pill-shaped (`rounded-full`) instead of the default `rounded-md`. */
  readonly rounded = input(false);
  /** Square padding sized to `size` instead of the default horizontal padding — for a button whose only content is a projected `[icon]`. Pair with `ariaLabel`, since there's no visible text for the accessible name to come from. */
  readonly iconOnly = input(false);
  /** Where the projected `[icon]` (or the `loading` spinner, which takes its place) sits relative to the label. `'top'`/`'bottom'` also stack the button's content vertically. */
  readonly iconPos = input<DynamoButtonIconPos>('left');
  /**
   * Forwarded to the native `<button>` as `aria-label`. Needed for icon-only
   * usage (no visible text content for the accessible name to come from) —
   * a plain `aria-label` attribute on `<dg-button>` itself would sit on the
   * non-interactive custom-element host, not the focusable native button
   * inside it, so it must be forwarded explicitly.
   */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-current` — e.g. `'page'` for a pagination control's active page button. Same forwarding rationale as `ariaLabel`. */
  readonly ariaCurrent = input<
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time'
    | 'true'
    | 'false'
    | undefined
  >(undefined);
  /** Forwarded to the native `<button>` as `role`, overriding its implicit button role — e.g. `'radio'` for a button acting as one segment of a single-select group. Same forwarding rationale as `ariaLabel`. */
  readonly role = input<string | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-checked` — for a button acting as a radio-group segment. */
  readonly ariaChecked = input<boolean | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-pressed` — for a button acting as a toggle in a multi-select group. */
  readonly ariaPressed = input<boolean | undefined>(undefined);
  /** Forwarded to the native `<button>` as `tabindex`, overriding its default tab-stop membership — for roving-tabindex patterns like Select Button's segmented control. */
  readonly tabIndexOverride = input<number | undefined>(undefined);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  private readonly isStacked = computed(
    () => this.iconPos() === 'top' || this.iconPos() === 'bottom',
  );

  // `size`'s own `h-8/10/12` (control-size.styles.ts) is a fixed single-line
  // height — left in place, it clips a stacked icon+label into too short a
  // box. Swaps it for `h-auto`/`min-h-*` (a floor, not the real driver —
  // actual height comes from the two rows of content) plus vertical padding
  // roughly matching each size's existing horizontal padding scale, only
  // when `iconPos` is 'top'/'bottom'.
  private static readonly STACKED_SIZE_CLASSES: Record<
    DynamoButtonSize,
    string
  > = {
    sm: 'h-auto min-h-8 flex-col py-1.5',
    md: 'h-auto min-h-10 flex-col py-2',
    lg: 'h-auto min-h-12 flex-col py-2.5',
  };

  protected readonly classes = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          buttonStyles({
            severity: this.severity(),
            size: this.size(),
            variant: this.variant(),
            fullWidth: this.fullWidth(),
            raised: this.raised(),
            rounded: this.rounded(),
            iconOnly: this.iconOnly(),
          }),
          this.isStacked() && DynamoButton.STACKED_SIZE_CLASSES[this.size()],
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );

  // `empty:hidden` removes this wrapper from flex layout entirely (no box at
  // all, so no gap contribution) when neither loading nor an [icon] is
  // projected — the common case, and what keeps every existing consumer's
  // layout untouched. `order-last` moves it after the label for a
  // 'right'/'bottom' iconPos without altering DOM/projection order, which
  // Angular's content projection requires staying fixed (a single
  // `<ng-content select="[icon]">` can only ever appear once in the template).
  protected readonly iconWrapperClasses = computed(() =>
    cn('empty:hidden', this.isReversed() && 'order-last'),
  );

  private readonly isReversed = computed(
    () => this.iconPos() === 'right' || this.iconPos() === 'bottom',
  );
}
