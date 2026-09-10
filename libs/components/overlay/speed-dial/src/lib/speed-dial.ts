import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { computeActionOffset } from './speed-dial.geometry';
import {
  speedDialActionStyles,
  speedDialListStyles,
  speedDialRootStyles,
  speedDialTriggerStyles,
} from './speed-dial.styles';
import type {
  DynamoSpeedDialAction,
  DynamoSpeedDialDirection,
  DynamoSpeedDialPart,
  DynamoSpeedDialType,
} from './speed-dial.types';

/**
 * A floating action button that fans out a set of action buttons on open —
 * along a line (`linear`) or around an arc (`circle` / `semi-circle` /
 * `quarter-circle`). Self-contained: the trigger and actions are plain
 * `<button>`s styled by `speed-dial.styles.ts`; the fan-out geometry is a
 * pure helper (`speed-dial.geometry.ts`).
 *
 * Focus model: the trigger is a real button (`aria-expanded` / `aria-controls`);
 * the action buttons are `tabindex="-1"` and moved through with the arrow
 * keys while open, `Escape` closes and refocuses the trigger, `Tab` closes.
 * A click outside the widget also closes it.
 */
@Component({
  selector: 'dg-speed-dial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './speed-dial.html',
})
export class DynamoSpeedDial extends DynamoBaseComponent<DynamoSpeedDialPart> {
  readonly actions = input.required<DynamoSpeedDialAction[]>();
  readonly direction = input<DynamoSpeedDialDirection>('up');
  readonly type = input<DynamoSpeedDialType>('linear');
  /** Two-way bindable open state. */
  readonly open = model(false);
  readonly openOnHover = input(false);
  /** Arc radius in px for the non-`linear` types. */
  readonly radius = input(90);
  /** Spacing in px between successive actions for the `linear` type. */
  readonly gap = input(56);
  readonly ariaLabel = input('Speed dial');
  readonly disabled = input(false);
  readonly actionSelect = output<DynamoSpeedDialAction>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly listId = this.idGenerator.next('dg-speed-dial-list');

  private hoverInside = false;

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(speedDialRootStyles, this.styleClass()),
  );
  protected readonly triggerClasses = computed(() =>
    speedDialTriggerStyles({ open: this.open() }),
  );
  protected readonly listClasses = computed(() =>
    speedDialListStyles({ open: this.open() }),
  );

  private readonly offsets = computed(() => {
    const actions = this.actions();
    return actions.map((_, index) =>
      computeActionOffset(
        index,
        actions.length,
        this.type(),
        this.direction(),
        this.radius(),
        this.gap(),
      ),
    );
  });

  protected actionClasses(action: DynamoSpeedDialAction): string {
    return speedDialActionStyles({ disabled: !!action.disabled });
  }

  protected actionTransform(index: number): string {
    if (!this.open()) {
      return 'translate(-50%, -50%) scale(0)';
    }
    const { x, y } = this.offsets()[index] ?? { x: 0, y: 0 };
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`;
  }

  protected toggle(): void {
    if (this.disabled()) return;
    this.open.update((value) => !value);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle();
        if (this.open()) this.focusAction(this.firstEnabledAction());
        break;
      case 'ArrowDown':
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (this.disabled()) return;
        event.preventDefault();
        if (!this.open()) this.open.set(true);
        this.focusAction(this.firstEnabledAction());
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  protected onActionKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusAction(this.findEnabledAction(index, 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.focusAction(this.findEnabledAction(index, -1));
        break;
      case 'Home':
        event.preventDefault();
        this.focusAction(this.firstEnabledAction());
        break;
      case 'End':
        event.preventDefault();
        this.focusAction(this.lastEnabledAction());
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.open.set(false);
        break;
    }
  }

  private firstEnabledAction(): number {
    return this.actions().findIndex((action) => !action.disabled);
  }

  private lastEnabledAction(): number {
    const list = this.actions();
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i]?.disabled) return i;
    }
    return -1;
  }

  /** Next enabled action index from `from`, stepping by `delta`, wrapping. */
  private findEnabledAction(from: number, delta: number): number {
    const list = this.actions();
    if (list.length === 0) return -1;
    let index = from;
    for (let step = 0; step < list.length; step++) {
      index = (index + delta + list.length) % list.length;
      if (!list[index]?.disabled) return index;
    }
    return from;
  }

  protected onTriggerHover(entering: boolean): void {
    if (!this.openOnHover() || this.disabled()) return;
    this.hoverInside = entering;
    if (entering) this.open.set(true);
    else this.scheduleHoverClose();
  }

  protected onListHover(entering: boolean): void {
    if (!this.openOnHover()) return;
    this.hoverInside = entering;
    if (!entering) this.scheduleHoverClose();
  }

  protected runAction(action: DynamoSpeedDialAction): void {
    if (action.disabled) return;
    this.actionSelect.emit(action);
    action.command?.();
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  private scheduleHoverClose(): void {
    // Let a move between the trigger and the list settle before deciding.
    setTimeout(() => {
      if (!this.hoverInside) this.open.set(false);
    }, 120);
  }

  private focusAction(index: number): void {
    if (index < 0) return;
    // Query the live DOM rather than a `viewChildren` signal — the action
    // buttons are always rendered, and this avoids the query not having
    // settled yet when called synchronously from a keydown handler.
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]',
    );
    buttons[index]?.focus();
  }

  private close(): void {
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }
}
