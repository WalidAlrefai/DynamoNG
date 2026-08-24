import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoButton } from '@dynamong/button';
import { DynamoCheckIcon } from '@dynamong/icons';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoStep } from './step';
import {
  stepperCircleStyles,
  stepperConnectorStyles,
  stepperControlsStyles,
  stepperItemStyles,
  stepperLabelStyles,
  stepperListStyles,
  stepperPanelStyles,
  stepperRootStyles,
  stepperStepButtonStyles,
} from './stepper.styles';
import type { DynamoStepperPart, DynamoStepState } from './stepper.types';

@Component({
  selector: 'dg-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoButton, DynamoCheckIcon],
  templateUrl: './stepper.html',
})
export class DynamoStepper extends DynamoBaseComponent<DynamoStepperPart> {
  /** Two-way bindable: `<dg-stepper [(value)]="active">`. */
  readonly value = model<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly backLabel = input('Back');
  readonly nextLabel = input('Next');
  readonly finishLabel = input('Finish');
  /** Fires instead of advancing when Next is clicked on the last step. */
  readonly finish = output<void>();

  protected readonly steps = contentChildren(DynamoStep);
  private readonly stepButtons =
    viewChildren<ElementRef<HTMLElement>>('stepButton');

  protected readonly stepsId = this.idGenerator.next('dg-stepper');

  // A step's state is purely a function of its position relative to the
  // active step — no separate "completed" tracking to keep in sync.
  // Per-step invalidation ("mark this completed step incomplete again") is a
  // real feature but explicitly out of scope for v1.
  protected readonly activeIndex = computed(() => {
    const stepsArr = this.steps();
    const index = stepsArr.findIndex((step) => step.value() === this.value());
    return index === -1 ? 0 : index;
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(stepperRootStyles, this.styleClass()),
  );
  protected readonly listClasses = stepperListStyles;
  protected readonly itemClasses = stepperItemStyles;
  protected readonly panelClasses = stepperPanelStyles;
  protected readonly controlsClasses = stepperControlsStyles;

  constructor() {
    super();

    // Keeps `value` valid whenever the step set changes (mount, or steps
    // added/removed) — falls back to the first step, mirroring Tabs'
    // fallback-to-first-enabled effect (steps have no "all disabled" case
    // to guard quite the same way, since upcoming steps are never the
    // active one by construction).
    effect(() => {
      const stepsArr = this.steps();
      if (stepsArr.length === 0) {
        return;
      }
      try {
        const current = stepsArr.find((step) => step.value() === this.value());
        if (current) {
          return;
        }
        const fallback = stepsArr.find((step) => !step.disabled()) ?? stepsArr[0];
        if (fallback && fallback.value() !== this.value()) {
          this.value.set(fallback.value());
        }
      } catch {
        // A content-projected step's required inputs may not be bound yet
        // during the same change-detection pass that adds/removes steps
        // (e.g. via @for) — skip this run; the effect re-fires once those
        // inputs settle. Same NG0950 guard used by DynamoTabs.
      }
    });

    // Latches the active step's lazy-mount flag once selection settles.
    effect(() => {
      const stepsArr = this.steps();
      const step = stepsArr[this.activeIndex()];
      step?.hasBeenActivated.set(true);
    });
  }

  // A skipped disabled step sitting before the active index still displays
  // as "completed" here (it's purely a position comparison) — a deliberate
  // simplification rather than adding a fourth "skipped" visual state for
  // what both next()/back() and this treat as the same "optional, passed
  // over" outcome as an actually-completed step.
  protected stepState(index: number): DynamoStepState {
    if (index < this.activeIndex()) {
      return 'completed';
    }
    if (index === this.activeIndex()) {
      return 'active';
    }
    return 'upcoming';
  }

  private goTo(index: number): void {
    const step = this.steps()[index];
    if (!step) {
      return;
    }
    step.hasBeenActivated.set(true);
    this.value.set(step.value());
  }

  /** Completed or current — never a not-yet-reached step. The linear gate. */
  private canActivate(index: number): boolean {
    return index <= this.activeIndex();
  }

  protected isDisabled(index: number): boolean {
    const step = this.steps()[index];
    return (step?.disabled() ?? false) || !this.canActivate(index);
  }

  protected stepButtonClasses(index: number) {
    return stepperStepButtonStyles({ disabled: this.isDisabled(index) });
  }

  protected circleClasses(index: number) {
    return stepperCircleStyles({ state: this.stepState(index) });
  }

  protected labelClasses(index: number) {
    return stepperLabelStyles({ state: this.stepState(index) });
  }

  protected connectorClasses(index: number) {
    return stepperConnectorStyles({
      completed: this.stepState(index) === 'completed',
    });
  }

  protected stepId(index: number): string {
    return `${this.stepsId}-step-${index}`;
  }

  protected panelId(index: number): string {
    return `${this.stepsId}-panel-${index}`;
  }

  protected onStepClick(index: number): void {
    const step = this.steps()[index];
    if (!step || step.disabled() || !this.canActivate(index)) {
      return;
    }
    this.goTo(index);
  }

  // Skips over any disabled ("optional") step in the direction of travel,
  // the same way Tabs skips disabled tabs during arrow-key navigation —
  // a skippable step should never be able to strand the wizard on it.
  protected next(): void {
    const stepsArr = this.steps();
    for (let i = this.activeIndex() + 1; i < stepsArr.length; i++) {
      if (!stepsArr[i]?.disabled()) {
        this.goTo(i);
        return;
      }
    }
    this.finish.emit();
  }

  protected back(): void {
    const stepsArr = this.steps();
    for (let i = this.activeIndex() - 1; i >= 0; i--) {
      if (!stepsArr[i]?.disabled()) {
        this.goTo(i);
        return;
      }
    }
  }

  protected onStepsKeydown(event: KeyboardEvent): void {
    const buttons = this.stepButtons();
    const currentIndex = buttons.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = this.findEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowLeft':
        nextIndex = this.findEnabledIndex(currentIndex, -1);
        break;
      case 'Home':
        nextIndex = this.findEnabledIndex(-1, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledIndex(0, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (nextIndex === null || nextIndex === currentIndex) {
      return;
    }
    // Arrow-key focus movement is unrestricted (a keyboard user can inspect
    // any step's label, including ones not yet reached) — only Enter/Space
    // (native button activation, handled by onStepClick) enforces the
    // linear gate. This is deliberately unlike Tabs' `automatic` activation
    // mode: auto-activating on focus would let arrow keys skip the gate.
    buttons[nextIndex]?.nativeElement.focus();
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled step index. Returns `null` if every step is disabled. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const stepsArr = this.steps();
    if (stepsArr.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < stepsArr.length; step++) {
      index = (index + delta + stepsArr.length) % stepsArr.length;
      if (!stepsArr[index]?.disabled()) {
        return index;
      }
    }
    return null;
  }
}
