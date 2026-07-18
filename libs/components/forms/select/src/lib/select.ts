import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { selectListboxStyles, selectOptionStyles, selectTriggerStyles } from './select.styles';
import type { DynamoSelectPart, DynamoSelectSize } from './select.types';

@Component({
  selector: 'dg-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoSelect),
      multi: true,
    },
  ],
})
export class DynamoSelect<TValue = unknown>
  extends DynamoBaseComponent<DynamoSelectPart>
  implements ControlValueAccessor
{
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  readonly placeholder = input('Select an option');
  readonly size = input<DynamoSelectSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<TValue | null>(null);
  readonly disabled = model(false);

  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly triggerId = this.idGenerator.next('dg-select-trigger');
  protected readonly listboxId = this.idGenerator.next('dg-select-listbox');

  private onChangeFn: (value: TValue | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly selectedOption = computed(() => {
    const value = this.value();
    return this.options().find((option) => option.value === value) ?? null;
  });

  protected readonly selectedLabel = computed(() => this.selectedOption()?.label ?? this.placeholder());

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(selectTriggerStyles({ size: this.size() }), this.styleClass()),
  );
  protected readonly listboxClasses = selectListboxStyles;

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected optionClasses(option: DynamoSelectOption<TValue>, index: number): string {
    return selectOptionStyles({ active: index === this.activeIndex(), disabled: !!option.disabled });
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return option.value === this.value();
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.openList();
    }
  }

  protected openList(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    const selectedIndex = this.options().findIndex((option) => option.value === this.value());
    this.activeIndex.set(selectedIndex >= 0 ? selectedIndex : this.firstEnabledIndex());
  }

  protected close(): void {
    this.isOpen.set(false);
    this.onTouchedFn();
  }

  protected selectOption(option: DynamoSelectOption<TValue>): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.onChangeFn(option.value);
    this.close();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(1);
        } else {
          this.openList();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(-1);
        } else {
          this.openList();
        }
        break;
      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.firstEnabledIndex());
        }
        break;
      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.lastEnabledIndex());
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const active = this.options()[this.activeIndex()];
          if (active) this.selectOption(active);
        } else {
          this.openList();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  private moveActive(delta: number): void {
    const options = this.options();
    if (options.length === 0) return;
    let index = this.activeIndex();
    for (let step = 0; step < options.length; step++) {
      index = (index + delta + options.length) % options.length;
      if (!options[index]?.disabled) {
        this.activeIndex.set(index);
        return;
      }
    }
  }

  private firstEnabledIndex(): number {
    return this.options().findIndex((option) => !option.disabled);
  }

  private lastEnabledIndex(): number {
    const options = this.options();
    for (let i = options.length - 1; i >= 0; i--) {
      if (!options[i]?.disabled) return i;
    }
    return -1;
  }

  writeValue(value: TValue | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TValue | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
