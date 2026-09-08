import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  knobDialStyles,
  knobFillStyles,
  knobLabelStyles,
  knobRootStyles,
  knobTrackStyles,
} from './knob.styles';
import type { DynamoKnobPart } from './knob.types';

@Component({
  selector: 'dg-knob',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './knob.html',
})
export class DynamoKnob extends DynamoBaseComponent<DynamoKnobPart> {
  /** Two-way bindable: `<dg-knob [(value)]="amount">`. */
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly size = input<DynamoSize>('md');
  readonly severity = input<DynamoSeverity>('primary');
  readonly ariaLabel = input<string | undefined>(undefined);

  // Slider's track fills 100% of its flex parent by CSS; a circle has no
  // such equivalent without a ResizeObserver, which is unwarranted
  // complexity for v1 — diameter/strokeWidth are explicit px inputs instead
  // (100/8 mirror PrimeNG's own Knob defaults).
  readonly diameter = input(100);
  readonly strokeWidth = input(8);
  // Whether the center numeric label renders at all — a compact visual-only
  // dial is a real PrimeNG use case, and hiding this later would be a
  // breaking change, so it ships now even though it's a one-line @if.
  readonly showValue = input(true);

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  protected readonly dragging = signal(false);

  // Single source of truth for both the ARIA attrs and the arc geometry —
  // derived once so they can never disagree, even for an out-of-range,
  // NaN-adjacent, or non-step-aligned `value` (mirrors Slider's
  // clampedValue). Kept as a 0-1 fraction (not Slider's percent's 0-100)
  // since the dashoffset formula below consumes a fraction directly and
  // there's no `%`-styled binding here the way Slider has [style.width.%].
  protected readonly clampedValue = computed(() => this.clamp(this.value()));
  protected readonly ratio = computed(() => {
    const range = this.max() - this.min();
    return range > 0 ? (this.clampedValue() - this.min()) / range : 0;
  });

  protected readonly radius = computed(
    () => this.diameter() / 2 - this.strokeWidth() / 2,
  );
  protected readonly circumference = computed(
    () => 2 * Math.PI * this.radius(),
  );
  protected readonly dashOffset = computed(
    () => this.circumference() * (1 - this.ratio()),
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(knobRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );
  protected readonly dialClasses = computed(() => knobDialStyles);
  protected readonly trackClasses = computed(() => knobTrackStyles);
  protected readonly fillClasses = computed(() =>
    knobFillStyles({ severity: this.severity() }),
  );
  protected readonly labelClasses = computed(() =>
    knobLabelStyles({ size: this.size() }),
  );

  private clamp(raw: number): number {
    if (Number.isNaN(raw)) {
      return this.min();
    }
    return Math.min(this.max(), Math.max(this.min(), this.snapToStep(raw)));
  }

  private snapToStep(raw: number): number {
    const step = this.step();
    if (step <= 0) {
      return raw;
    }
    const min = this.min();
    return Math.round((raw - min) / step) * step + min;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const step = this.step();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = this.clampedValue() + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = this.clampedValue() - step;
        break;
      case 'PageUp':
        next = this.clampedValue() + step * 10;
        break;
      case 'PageDown':
        next = this.clampedValue() - step * 10;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.value.set(this.clamp(next));
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }
    this.dragging.set(true);
    this.updateFromPointer(event.clientX, event.clientY);
    this.svgRef().nativeElement.focus();
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Slider's/Carousel's pointer-drag.
    (
      event.currentTarget as SVGSVGElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.updateFromPointer(event.clientX, event.clientY);
  }

  protected onPointerUp(): void {
    this.dragging.set(false);
  }

  // Focus-only by design: wheel only adjusts the value once the dial is
  // genuinely focused (not merely hovered), so a Knob sitting mid-page never
  // silently hijacks the page's scroll — the same convention browsers use
  // to gate scroll-to-adjust on a native <input type="number">. No focus
  // check happens inside a template binding for this — it's read here so
  // the handler stays a single, directly testable unit.
  protected onWheel(event: WheelEvent): void {
    if (this.disabled() || document.activeElement !== this.svgRef().nativeElement) {
      return;
    }
    event.preventDefault();
    // Exactly one step per wheel event regardless of deltaY's magnitude —
    // deliberately not scaled by delta. Trackpads emit many small-magnitude
    // events per physical gesture while mice emit few large ones, and
    // normalizing correctly across both device classes is out of scope for
    // v1 (flagged as a possible future enhancement, not built speculatively
    // now). Negative deltaY ("scroll up"/away from the user) increments,
    // matching a physical volume-knob's conventional scroll direction.
    const direction = event.deltaY < 0 ? 1 : -1;
    this.value.set(this.clamp(this.clampedValue() + direction * this.step()));
  }

  // Full 360deg sweep only for v1 (0% and 100% both sit at 12 o'clock,
  // value increases clockwise) — no configurable start/end angle like
  // PrimeNG's rarely-used partial-arc option. This keeps the pointer-angle
  // math a single unconditional formula instead of needing a second
  // angle-range branch. The trade-off: dragging across the 12 o'clock seam
  // is an inherent discontinuity (value jumps from ~max to ~min) — the same
  // behavior PrimeNG's own full-circle Knob has, not a bug to fix here.
  private angleFromPointer(clientX: number, clientY: number): number {
    const rect = this.svgRef().nativeElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // atan2(dy, dx) gives the angle from the positive x-axis (3 o'clock),
    // increasing counter-clockwise. Adding PI/2 rotates the reference axis
    // to 12 o'clock; screen Y growing downward is what makes the result
    // increase clockwise once rotated this way.
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    // Normalize into [0, 2*PI) — the +PI/2 offset can land slightly below 0
    // for pointer positions in the upper-left quadrant.
    if (angle < 0) {
      angle += 2 * Math.PI;
    }
    return angle;
  }

  private valueFromAngle(angle: number): number {
    const ratio = angle / (2 * Math.PI);
    return this.min() + ratio * (this.max() - this.min());
  }

  private updateFromPointer(clientX: number, clientY: number): void {
    const rect = this.svgRef().nativeElement.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }
    const angle = this.angleFromPointer(clientX, clientY);
    this.value.set(this.clamp(this.valueFromAngle(angle)));
  }
}
