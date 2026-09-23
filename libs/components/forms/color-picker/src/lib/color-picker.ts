import { NgTemplateOutlet } from '@angular/common';
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
  signal,
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { DynamoSize } from '@dynamong/core/api';
import { DynamoListboxBase, selectPanelWrapperStyles } from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  alphaFromHexColor,
  clamp01,
  hexFromHsv,
  hsvOf,
  rgbHexOf,
  withAlpha,
} from './color-picker.color';
import {
  CHECKERBOARD_GRADIENT,
  HUE_TRACK_GRADIENT,
  colorPickerAlphaReadoutStyles,
  colorPickerAlphaWrapperStyles,
  colorPickerHexInputStyles,
  colorPickerHueWrapperStyles,
  colorPickerNativeInputStyles,
  colorPickerNativeInputWrapperStyles,
  colorPickerRangeSliderStyles,
  colorPickerSvSquareStyles,
  colorPickerSvThumbStyles,
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
  imports: [NgTemplateOutlet],
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
  /** Renders the swatch grid + native color input directly in the page, with no trigger button or overlay — for embedding the picker permanently rather than behind a popup. */
  readonly inline = input(false);
  /** Two-way bindable; also driven by Angular forms via `writeValue`. Empty until set. Accepts `#rrggbb`, or `#rrggbbaa` when `showAlpha` is on. */
  readonly value = model('');
  /** Renders an alpha (opacity) slider in the panel and lets `value` carry an 8-digit `#rrggbbaa` hex string in addition to `#rrggbb`. Off by default — existing consumers see no behavior change. */
  readonly showAlpha = input(false);
  /** Replaces the native `<input type="color">` in the panel with a self-contained saturation/brightness square + hue slider — no OS color-picker dialog. Off by default. Independent of `swatches` — presets and the custom picker are complementary, not exclusive. */
  readonly customPicker = input(false);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  // Plain (optional) viewChild, not .required — only rendered when
  // customPicker() is true, same reasoning as Slider's own optional
  // max-thumb ref (only present in range mode).
  private readonly svSquareRef = viewChild<ElementRef<HTMLElement>>('svSquare');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  /** Feeds the embedded native `<input type="color">`, which requires a strict `#rrggbb` string and silently resets to `#000000` for anything else — this doesn't affect the component's own bound `value`. Also strips any alpha suffix, since the native input is alpha-blind. */
  protected readonly normalizedNativeColorValue = computed(() =>
    rgbHexOf(this.value()),
  );

  protected readonly alpha = computed(() => alphaFromHexColor(this.value()));
  protected readonly alphaPercentLabel = computed(
    () => `${Math.round(this.alpha() * 100)}%`,
  );
  /** Two-layer gradient (flat color-as-gradient over a checkerboard) so the
   *  trigger preview shows transparency correctly. `null` when `showAlpha`
   *  is off or `value` is empty, so the existing `[style.background-color]`
   *  binding alone renders — pixel-identical to before alpha existed. */
  protected readonly triggerPreviewBackground = computed(() => {
    if (!this.showAlpha() || !this.value()) return null;
    const v = this.value();
    return `linear-gradient(${v}, ${v}), ${CHECKERBOARD_GRADIENT}`;
  });
  /** Left-to-right gradient from transparent to the current opaque RGB,
   *  layered over the checkerboard, so the alpha slider's own track
   *  visualizes what each position on it means. */
  protected readonly alphaTrackBackground = computed(() => {
    const rgb = rgbHexOf(this.value());
    return `linear-gradient(to right, transparent, ${rgb}), ${CHECKERBOARD_GRADIENT}`;
  });

  protected readonly hsv = computed(() => hsvOf(this.value()));
  protected readonly rgbHexOfCurrent = computed(() => rgbHexOf(this.value()));
  protected readonly svThumbLeftPercent = computed(() => this.hsv().s * 100);
  protected readonly svThumbTopPercent = computed(
    () => (1 - this.hsv().v) * 100,
  );
  protected readonly svSquareBackground = computed(() => {
    const { h } = this.hsv();
    return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`;
  });
  protected readonly hueTrackGradient = HUE_TRACK_GRADIENT;
  protected readonly svDragging = signal(false);

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
  protected readonly alphaWrapperClasses = colorPickerAlphaWrapperStyles;
  protected readonly rangeSliderClasses = computed(() =>
    colorPickerRangeSliderStyles({ size: this.size() }),
  );
  protected readonly alphaReadoutClasses = colorPickerAlphaReadoutStyles;
  protected readonly svSquareClasses = colorPickerSvSquareStyles;
  protected readonly svThumbClasses = colorPickerSvThumbStyles;
  protected readonly hueWrapperClasses = colorPickerHueWrapperStyles;

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
    return rgbHexOf(this.value()) === rgbHexOf(swatch);
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
    const next = this.showAlpha() ? withAlpha(swatch, this.alpha()) : swatch;
    this.value.set(next);
    this.onChangeFn(next);
    this.close();
    if (!this.inline()) {
      this.triggerEl().nativeElement.focus();
    }
  }

  protected onNativeColorInput(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    const next = this.showAlpha() ? withAlpha(color, this.alpha()) : color;
    this.value.set(next);
    this.onChangeFn(next);
    this.close();
    if (!this.inline()) {
      this.triggerEl().nativeElement.focus();
    }
  }

  /** Continuous drag/keyboard control — deliberately does NOT close()/
   *  refocus the trigger, same reasoning as the hex field never closing
   *  on input. */
  protected onAlphaInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const next = withAlpha(this.value(), raw);
    this.value.set(next);
    this.onChangeFn(next);
  }

  protected onSvPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    this.svDragging.set(true);
    this.updateFromSvPointer(event.clientX, event.clientY);
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Slider's/Knob's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onSvPointerMove(event: PointerEvent): void {
    if (!this.svDragging()) return;
    this.updateFromSvPointer(event.clientX, event.clientY);
  }

  protected onSvPointerUp(): void {
    if (this.svDragging()) this.onTouchedFn();
    this.svDragging.set(false);
  }

  // Arrow keys nudge saturation/brightness by 2% (20% with Shift) — the
  // keyboard-accessible path for this 2-axis control. Deliberately not
  // given role="slider" (that ARIA role models one value on one axis;
  // this is two) — aria-label plus real keyboard operability, short of a
  // fully screen-reader-narrated numeric readout on this one control.
  protected onSvKeydown(event: KeyboardEvent): void {
    const { h, s, v } = this.hsv();
    const step = event.shiftKey ? 0.2 : 0.02;
    switch (event.key) {
      case 'ArrowLeft':
        this.commitHsv(h, clamp01(s - step), v);
        break;
      case 'ArrowRight':
        this.commitHsv(h, clamp01(s + step), v);
        break;
      case 'ArrowUp':
        this.commitHsv(h, s, clamp01(v + step));
        break;
      case 'ArrowDown':
        this.commitHsv(h, s, clamp01(v - step));
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Continuous drag/keyboard control — deliberately does NOT close()/
   *  refocus the trigger, same reasoning as the alpha slider. */
  protected onHueInput(event: Event): void {
    const h = Number((event.target as HTMLInputElement).value);
    const { s, v } = this.hsv();
    this.commitHsv(h, s, v);
  }

  private updateFromSvPointer(clientX: number, clientY: number): void {
    const el = this.svSquareRef()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = rect.width > 0 ? clamp01((clientX - rect.left) / rect.width) : 0;
    const v =
      rect.height > 0 ? 1 - clamp01((clientY - rect.top) / rect.height) : 0;
    this.commitHsv(this.hsv().h, s, v);
  }

  // Mirrors selectSwatch's/onNativeColorInput's own alpha-preserving
  // pattern exactly (same showAlpha() branch, same withAlpha call).
  // Deliberately does NOT close()/refocus — a continuous drag/keyboard
  // control, same reasoning as the alpha slider.
  private commitHsv(h: number, s: number, v: number): void {
    const rgbHex = hexFromHsv(h, s, v);
    const next = this.showAlpha() ? withAlpha(rgbHex, this.alpha()) : rgbHex;
    this.value.set(next);
    this.onChangeFn(next);
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
