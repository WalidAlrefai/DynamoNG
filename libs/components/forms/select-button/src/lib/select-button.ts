import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  selectButtonRootStyles,
  selectButtonSegmentPosition,
  selectButtonSegmentStyles,
} from './select-button.styles';
import type {
  DynamoSelectButtonPart,
  DynamoSelectButtonSize,
  DynamoSelectButtonValue,
  DynamoSelectOption,
} from './select-button.types';

@Component({
  selector: 'dg-select-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton],
  templateUrl: './select-button.html',
})
export class DynamoSelectButton<TValue = string> extends DynamoBaseComponent<DynamoSelectButtonPart> {
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  /** Two-way bindable. Scalar (`TValue | null`) in single-select mode, array (`TValue[]`) once `multiple` is true. */
  readonly value = model<DynamoSelectButtonValue<TValue>>(null);
  readonly multiple = input(false);
  readonly size = input<DynamoSelectButtonSize>('md');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly segmentHosts = viewChildren<DynamoButton, ElementRef<HTMLElement>>('segment', { read: ElementRef });
  protected readonly focusedIndex = signal(0);
  private hasSeededFocus = false;

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(selectButtonRootStyles, this.styleClass()),
  );

  constructor() {
    super();
    // Seed the roving tab stop to the selected segment (single mode) or the
    // first segment (multi mode / nothing selected) exactly once — after
    // that, the user's own focus/arrow-key movement owns `focusedIndex`.
    effect(() => {
      const opts = this.options();
      if (this.hasSeededFocus || opts.length === 0) return;
      this.hasSeededFocus = true;
      const selectedIndex = opts.findIndex((o) => this.isSelected(o.value));
      this.focusedIndex.set(selectedIndex >= 0 ? selectedIndex : 0);
    });
  }

  private toArray(value: DynamoSelectButtonValue<TValue>): TValue[] {
    if (value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  protected isSelected(optionValue: TValue): boolean {
    return this.toArray(this.value()).includes(optionValue);
  }

  protected isDisabled(option: DynamoSelectOption<TValue>): boolean {
    return this.disabled() || !!option.disabled;
  }

  protected segmentClasses(index: number): string {
    const option = this.options()[index];
    return selectButtonSegmentStyles({
      position: selectButtonSegmentPosition(index, this.options().length),
      selected: option !== undefined && this.isSelected(option.value),
    });
  }

  protected tabIndexFor(index: number): number {
    return index === this.focusedIndex() ? 0 : -1;
  }

  protected activate(option: DynamoSelectOption<TValue>): void {
    if (this.isDisabled(option)) return;

    if (this.multiple()) {
      const current = this.toArray(this.value());
      const next = current.includes(option.value)
        ? current.filter((v) => v !== option.value)
        : [...current, option.value];
      this.value.set(next);
    } else {
      // Clicking the already-active segment is a no-op re-set — a select
      // button never toggles off, matching "always exactly one" radio-group
      // semantics.
      this.value.set(option.value);
    }
  }

  protected onSegmentKeydown(event: KeyboardEvent, index: number): void {
    const options = this.options();
    const enabled = (i: number) => !this.isDisabled(options[i] as DynamoSelectOption<TValue>);
    const move = (from: number, delta: number): number => {
      let i = from;
      for (let n = 0; n < options.length; n++) {
        i = (i + delta + options.length) % options.length;
        if (enabled(i)) return i;
      }
      return from;
    };

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusAndMaybeSelect(move(index, 1));
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusAndMaybeSelect(move(index, -1));
        break;
      case 'Home':
        event.preventDefault();
        this.focusAndMaybeSelect(move(-1, 1));
        break;
      case 'End':
        event.preventDefault();
        this.focusAndMaybeSelect(move(options.length, -1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activate(options[index] as DynamoSelectOption<TValue>);
        break;
    }
  }

  private focusAndMaybeSelect(index: number): void {
    this.focusedIndex.set(index);
    if (!this.multiple()) {
      this.activate(this.options()[index] as DynamoSelectOption<TValue>);
    }
    // Move real DOM focus to match the roving tabindex — queued so the
    // `[attr.tabindex]` update from the signal write above has already
    // rendered before we try to focus the (now tabbable) native button.
    queueMicrotask(() => {
      const host = this.segmentHosts()[index]?.nativeElement;
      host?.querySelector('button')?.focus();
    });
  }
}
