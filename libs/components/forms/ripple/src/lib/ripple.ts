import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input } from '@angular/core';
import { rippleSpanStyles } from './ripple.styles';

/**
 * Material-style pointer ripple. On `pointerdown` it appends a `<span>` at the
 * press point, sized to cover the host, and animates it outward with the Web
 * Animations API (no CSS keyframe, so nothing global is needed). Honours
 * `prefers-reduced-motion` and `dgRippleDisabled`.
 */
@Directive({
  selector: '[dgRipple]',
  standalone: true,
  host: {
    '(pointerdown)': 'spawn($event)',
  },
})
export class DynamoRipple {
  readonly disabled = input(false, { alias: 'dgRippleDisabled' });
  /** Overrides the default `bg-current/30` tint with an explicit CSS colour. */
  readonly color = input<string | undefined>(undefined, {
    alias: 'dgRippleColor',
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  protected spawn(event: PointerEvent): void {
    if (this.disabled()) return;
    if (
      this.document.defaultView
        ?.matchMedia?.('(prefers-reduced-motion: reduce)')
        .matches
    ) {
      return;
    }

    const host = this.host.nativeElement;
    const style = getComputedStyle(host);
    if (!['relative', 'absolute', 'fixed', 'sticky'].includes(style.position)) {
      host.style.position = 'relative';
    }
    if (style.overflow !== 'hidden' && style.overflow !== 'clip') {
      host.style.overflow = 'hidden';
    }

    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Diameter = twice the distance from the press point to the farthest corner.
    const radius = Math.max(
      Math.hypot(x, y),
      Math.hypot(rect.width - x, y),
      Math.hypot(x, rect.height - y),
      Math.hypot(rect.width - x, rect.height - y),
    );
    const size = radius * 2;

    const span = this.document.createElement('span');
    span.className = rippleSpanStyles;
    span.setAttribute('aria-hidden', 'true');
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${x - radius}px`;
    span.style.top = `${y - radius}px`;
    if (this.color()) span.style.backgroundColor = this.color() as string;
    host.appendChild(span);

    const duration = 500;
    const animation = span.animate(
      [
        { transform: 'scale(0)', opacity: 0.5 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration, easing: 'ease-out' },
    );
    // `finished` resolves when the animation completes; the timeout is a
    // fallback for a backgrounded tab, where WAAPI is frozen and `finished`
    // never settles — the span would otherwise linger forever.
    const cleanup = () => span.remove();
    animation.finished.then(cleanup, cleanup);
    setTimeout(cleanup, duration + 100);
  }
}
