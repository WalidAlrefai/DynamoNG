import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  type OnInit,
  computed,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import {
  type AbstractControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  type ControlValueAccessor,
} from '@angular/forms';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoRadioControlRegistry } from './radio-registry';
import {
  radioCircleStyles,
  radioDotStyles,
  radioRootStyles,
} from './radio.styles';
import type {
  DynamoRadioPart,
  DynamoRadioSize,
  DynamoRadioVariant,
} from './radio.types';

@Component({
  selector: 'dg-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './radio.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoRadio),
      multi: true,
    },
  ],
})
export class DynamoRadio
  extends DynamoBaseComponent<DynamoRadioPart>
  implements ControlValueAccessor, OnInit
{
  /**
   * Two-way bindable, like `DynamoCheckbox`'s `checked` — `model()` generates
   * both a `checked` input and a `checkedChange` output.
   *
   * A native `<input type="radio">` never fires `change` on a sibling that
   * becomes deselected because a different radio sharing its `name` was
   * clicked, so full `[(checked)]="perRadioSignal"` binding across a group of
   * siblings will NOT keep them in sync — the deselected sibling's own signal
   * never learns it was deselected. For grouped usage, bind the split form
   * instead (both halves come from the same `model()`, no separate API):
   *
   * ```html
   * <dg-radio name="fruit" value="apple" [checked]="fruit() === 'apple'" (checkedChange)="fruit.set('apple')">Apple</dg-radio>
   * <dg-radio name="fruit" value="banana" [checked]="fruit() === 'banana'" (checkedChange)="fruit.set('banana')">Banana</dg-radio>
   * ```
   *
   * A single, standalone radio (no siblings sharing `name`) can safely use
   * full two-way `[(checked)]` binding, same as `DynamoCheckbox`.
   */
  readonly checked = model(false);
  readonly name = input.required<string>();
  readonly value = input<string>('');
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly size = input<DynamoRadioSize>('md');
  readonly variant = input<DynamoRadioVariant>('outlined');
  readonly invalid = input(false);
  /** HTML `readonly` semantics: the current selection stays visible and the
   *  input stays focusable/tabbable, but selecting is blocked. Unlike
   *  `disabled`, does not remove the control from the tab order or dim its
   *  appearance. Mirrors `DynamoCheckbox`'s `readOnly`. */
  readonly readOnly = input(false);
  /** Accessible name for the native radio when no visible label content is projected. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the native radio with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  protected readonly inputId = this.idGenerator.next('dg-radio');

  private readonly registry = inject(DynamoRadioControlRegistry);
  private readonly injector = inject(Injector);
  /** Resolved lazily in `ngOnInit` (mirroring Angular's own
   *  `RadioControlValueAccessor`, which does the same for the same reason):
   *  injecting `NgControl` directly in the constructor would be circular —
   *  the directive providing it (`FormControlName`/`NgModel`) itself
   *  injects `NG_VALUE_ACCESSOR`, which resolves back to this component.
   *  Resolving via `Injector.get()` after both are constructed avoids that.
   *  `null` for the plain split-binding group pattern, which has no
   *  `NgControl` at all. Used by `DynamoRadioControlRegistry` to scope
   *  sibling-sync by form root. */
  private ngControl: NgControl | null = null;
  // Only true once Angular Forms actually wires this instance up
  // (registerOnChange is only ever called by formControl/formControlName/
  // ngModel) — the plain split-binding group pattern never touches CVA at
  // all, and self-syncs siblings via its own one-way `[checked]` input, so
  // the registry must never mutate a non-forms-controlled sibling's
  // `checked` (doing so would fire a spurious `checkedChange` that a naive
  // "any change means select me" handler, as shown in this class's own
  // documented split-binding pattern, would misinterpret).
  private formsControlled = false;
  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  constructor() {
    super();
    this.registry.add(this);
    inject(DestroyRef).onDestroy(() => this.registry.remove(this));
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl, null);
  }

  /** `null` for the plain split-binding pattern (no `NgControl` resolved) — see
   *  `ngControl`'s own doc comment. */
  formRoot(): AbstractControl | null {
    return this.ngControl?.control?.root ?? null;
  }

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          radioRootStyles({ disabled: this.disabled() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );

  // The visual circle is structural (the native input is visually hidden), so
  // it stays styled even when `unstyled` is set — same rationale as Checkbox's box.
  protected readonly circleClasses = computed(() =>
    cn(
      radioCircleStyles({
        size: this.size(),
        checked: this.checked(),
        variant: this.variant(),
        invalid: this.invalid(),
      }),
      this.ptFor('circle').class,
    ),
  );

  protected readonly dotClasses = computed(() =>
    radioDotStyles({ size: this.size() }),
  );

  protected readonly labelClasses = computed(() =>
    cn('text-sm', this.ptFor('label').class),
  );

  protected readonly inputClasses = computed(() =>
    cn('peer sr-only', this.ptFor('input').class),
  );

  protected onNativeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly()) {
      // The native radio already flipped its own DOM state on click — revert
      // it so `checked()` stays the source of truth, same pattern as
      // `DynamoCheckbox`'s `onNativeChange`.
      target.checked = this.checked();
      return;
    }
    // Native radios only ever fire `change` when becoming checked, never when
    // deselected by a sibling — so this only ever sets `true`, matching that.
    if (target.checked) {
      this.checked.set(true);
      this.onChangeFn(this.value());
      this.onTouchedFn();
      if (this.formsControlled) {
        this.registry.select(this);
      }
    }
  }

  /** @internal used by `DynamoRadioControlRegistry` to skip siblings using the plain split-binding pattern, which must never be mutated here. */
  isFormsControlled(): boolean {
    return this.formsControlled;
  }

  /**
   * `value` is `unknown` (not `string`) to satisfy `ControlValueAccessor`'s
   * contract, matching whatever type the bound `FormControl`/`ngModel`
   * actually holds — compared against this radio's own `value()` with `===`
   * to decide `checked`, the same technique `RadioControlValueAccessor` uses.
   */
  writeValue(value: unknown): void {
    this.checked.set(value === this.value());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.formsControlled = true;
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
