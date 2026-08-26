import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { DynamoSize } from '@dynamong/core/api';
import { DynamoListboxBase, selectPanelWrapperStyles } from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  colorPickerHexInputStyles,
  colorPickerNativeInputStyles,
  colorPickerNativeInputWrapperStyles,
  colorPickerSwatchButtonStyles,
  colorPickerSwatchGridStyles,
  colorPickerSwatchOptionStyles,
  colorPickerWrapperStyles,
} from './color-picker.styles';
import type { DynamoColorPickerPart } from './color-picker.types';

const DEFAULT_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#000000',
  '#ffffff',
];

// Preferred corner first (bottom-start), the other three as CDK collision
// fallbacks — same shape as DynamoDatePicker's, no `position` input in v1.
const POSITIONS: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
];

@Component({
  selector: 'dg-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './color-picker.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoColorPicker),
      multi: true,
    },
  ],
})
export class DynamoColorPicker
  extends DynamoListboxBase<DynamoColorPickerPart>
  implements ControlValueAccessor
{
  readonly size = input<DynamoSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly swatches = input<string[]>(DEFAULT_SWATCHES);
  /** Two-way bindable; also driven by Angular forms via `writeValue`. Empty until set. */
  readonly value = model('');

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  /** Feeds the embedded native `<input type="color">`, which requires a strict `#rrggbb` string and silently resets to `#000000` for anything else — this doesn't affect the component's own bound `value`. */
  protected readonly normalizedNativeColorValue = computed(() =>
    /^#[0-9a-f]{6}$/i.test(this.value()) ? this.value() : '#000000',
  );

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          colorPickerWrapperStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly hexInputClasses = colorPickerHexInputStyles;
  protected readonly swatchButtonClasses = computed(() =>
    colorPickerSwatchButtonStyles({ size: this.size() }),
  );
  protected readonly panelWrapperClasses = selectPanelWrapperStyles;
  protected readonly swatchGridClasses = colorPickerSwatchGridStyles;
  protected readonly nativeInputWrapperClasses =
    colorPickerNativeInputWrapperStyles;
  protected readonly nativeInputClasses = colorPickerNativeInputStyles;

  constructor() {
    super();

    effect(() => {
      if (this.isOpen()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected swatchOptionClasses(selected: boolean): string {
    return colorPickerSwatchOptionStyles({ selected });
  }

  protected isSameColor(swatch: string): boolean {
    return this.value().toLowerCase() === swatch.toLowerCase();
  }

  protected toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.onTouchedFn();
  }

  protected onHexInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChangeFn(text);
  }

  protected selectSwatch(swatch: string): void {
    this.value.set(swatch);
    this.onChangeFn(swatch);
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  protected onNativeColorInput(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.value.set(color);
    this.onChangeFn(color);
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  // Focus never moves into the panel on open (unlike DatePicker's day grid) —
  // the swatch grid relies on plain Tab order, so while the panel is open
  // but nothing inside it has been tabbed to yet, focus is still on the
  // trigger itself. Escape needs to be reachable from there too, not just
  // from onPanelKeydown (which only fires once focus has actually moved
  // into the portaled panel).
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerEl().nativeElement.focus();
    }
  }

  protected triggerElRef(): ElementRef<HTMLElement> {
    return this.triggerEl();
  }

  protected panelTemplateRef(): TemplateRef<unknown> {
    return this.panelTemplate();
  }

  protected overlayPositions(): ConnectedPosition[] {
    return POSITIONS;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
