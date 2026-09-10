import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

type TargetKeyword = '@next' | '@prev' | '@parent' | '@grandparent';

/**
 * On each click of the host, mutates CSS classes on a resolved target
 * element — the lightweight animation/visibility toggler from PrimeNG.
 *
 * The target selector (`dgStyleClass`) is a CSS selector, or one of the
 * relative keywords `@next` / `@prev` / `@parent` / `@grandparent`.
 *
 * - `toggleClass` — simply toggled on the target each click.
 * - `enterClass` / `leaveClass` — swapped on alternating clicks (show / hide).
 * - `hideOnOutsideClick` — while shown, a document click outside the host and
 *   target hides it.
 */
@Directive({
  selector: '[dgStyleClass]',
  standalone: true,
  host: {
    '(click)': 'onClick()',
  },
})
export class DynamoStyleClass {
  readonly target = input.required<string>({ alias: 'dgStyleClass' });
  readonly toggleClass = input<string | undefined>(undefined);
  readonly enterClass = input<string | undefined>(undefined);
  readonly leaveClass = input<string | undefined>(undefined);
  readonly hideOnOutsideClick = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private shown = false;
  private outsideClickHandler: ((event: MouseEvent) => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.teardownOutsideClick());
  }

  protected onClick(): void {
    const target = this.resolveTarget();
    if (!target) return;

    const toggle = this.toggleClass();
    if (toggle) {
      this.shown = target.classList.toggle(toggle);
    } else {
      this.shown = !this.shown;
      this.applyEnterLeave(target);
    }

    if (this.hideOnOutsideClick()) {
      if (this.shown) this.setupOutsideClick(target);
      else this.teardownOutsideClick();
    }
  }

  private applyEnterLeave(target: HTMLElement): void {
    const enter = this.enterClass();
    const leave = this.leaveClass();
    if (this.shown) {
      if (leave) target.classList.remove(leave);
      if (enter) target.classList.add(enter);
    } else {
      if (enter) target.classList.remove(enter);
      if (leave) target.classList.add(leave);
    }
  }

  private hide(target: HTMLElement): void {
    const toggle = this.toggleClass();
    if (toggle) target.classList.remove(toggle);
    this.shown = false;
    if (!toggle) this.applyEnterLeave(target);
    this.teardownOutsideClick();
  }

  private setupOutsideClick(target: HTMLElement): void {
    this.teardownOutsideClick();
    const handler = (event: MouseEvent) => {
      const node = event.target as Node;
      if (
        !this.host.nativeElement.contains(node) &&
        !target.contains(node)
      ) {
        this.hide(target);
      }
    };
    this.outsideClickHandler = handler;
    // Deferred so the click that opened it doesn't immediately close it.
    setTimeout(() => this.document.addEventListener('click', handler));
  }

  private teardownOutsideClick(): void {
    if (this.outsideClickHandler) {
      this.document.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }

  private resolveTarget(): HTMLElement | null {
    const selector = this.target();
    const host = this.host.nativeElement;
    switch (selector as TargetKeyword) {
      case '@next':
        return host.nextElementSibling as HTMLElement | null;
      case '@prev':
        return host.previousElementSibling as HTMLElement | null;
      case '@parent':
        return host.parentElement;
      case '@grandparent':
        return host.parentElement?.parentElement ?? null;
      default:
        return this.document.querySelector<HTMLElement>(selector);
    }
  }
}
