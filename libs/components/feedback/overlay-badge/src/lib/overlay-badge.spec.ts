import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoOverlayBadge } from './overlay-badge';
import { DynamoOverlayBadgeHarness } from './overlay-badge.harness';
import type { DynamoOverlayBadgePosition } from './overlay-badge.types';

@Component({
  selector: 'dg-overlay-badge-host',
  standalone: true,
  imports: [DynamoOverlayBadge],
  template: `
    <dg-overlay-badge
      [value]="value()"
      [dot]="dot()"
      [max]="max()"
      [position]="position()"
    >
      <button type="button" aria-label="Notifications">🔔</button>
    </dg-overlay-badge>
  `,
})
class OverlayBadgeHostComponent {
  readonly value = signal<string | number | undefined>(3);
  readonly dot = signal(false);
  readonly max = signal<number | undefined>(undefined);
  readonly position = signal<DynamoOverlayBadgePosition>('top-right');
}

/** The `<dg-badge>` renders its classes onto an inner `<span>`. */
function badgeSpan(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="DynamoOverlayBadge-badge"] span');
}
function badgeText(container: HTMLElement): string | null {
  const el = container.querySelector('[data-testid="DynamoOverlayBadge-badge"]');
  return el ? (el.textContent?.trim() ?? '') : null;
}
function dot(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="DynamoOverlayBadge-dot"]');
}

describe('DynamoOverlayBadge', () => {
  describe('creation', () => {
    it('renders the projected element and a badge with the value', () => {
      const { container } = renderDynamoComponent(OverlayBadgeHostComponent);

      expect(
        container.querySelector('button[aria-label="Notifications"]'),
      ).toBeTruthy();
      expect(badgeText(container)).toBe('3');
      expect(dot(container)).toBeNull();
    });
  });

  describe('value & max', () => {
    it('renders a numeric value verbatim', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.value.set(12);
      fixture.detectChanges();
      expect(badgeText(container)).toBe('12');
    });

    it('caps a numeric value above `max` as `${max}+`', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.value.set(250);
      componentInstance.max.set(99);
      fixture.detectChanges();
      expect(badgeText(container)).toBe('99+');
    });

    it('renders a string value as-is (max is ignored)', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.value.set('NEW');
      componentInstance.max.set(9);
      fixture.detectChanges();
      expect(badgeText(container)).toBe('NEW');
    });
  });

  describe('dot mode', () => {
    it('renders a bare dot (no text) when `dot` is true', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.dot.set(true);
      fixture.detectChanges();

      expect(dot(container)).toBeTruthy();
      expect(badgeText(container)).toBeNull();
    });

    it('renders a dot when `value` is unset', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.value.set(undefined);
      fixture.detectChanges();
      expect(dot(container)).toBeTruthy();
    });
  });

  describe('position', () => {
    it('applies corner classes for each position', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );

      expect(badgeSpan(container)?.className).toContain('top-0');
      expect(badgeSpan(container)?.className).toContain('end-0');

      componentInstance.position.set('bottom-left');
      fixture.detectChanges();
      expect(badgeSpan(container)?.className).toContain('bottom-0');
      expect(badgeSpan(container)?.className).toContain('start-0');
    });
  });

  describe('severity', () => {
    it('colours the dot from the severity palette', () => {
      @Component({
        selector: 'dg-ob-sev-host',
        standalone: true,
        imports: [DynamoOverlayBadge],
        template: `<dg-overlay-badge [dot]="true" severity="success"
          ><span>x</span></dg-overlay-badge
        >`,
      })
      class SevHost {}

      const { container } = renderDynamoComponent(SevHost);
      expect(dot(container)?.className).toContain('bg-success');
    });
  });

  describe('harness', () => {
    it('reads the badge text, dot state, and position', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOverlayBadgeHarness,
      );

      expect(await harness.isDot()).toBe(false);
      expect(await harness.getBadgeText()).toBe('3');
      expect(await harness.getPosition()).toBe('top-right');

      componentInstance.dot.set(true);
      fixture.detectChanges();
      expect(await harness.isDot()).toBe(true);
      expect(await harness.getBadgeText()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations — the marker is decorative, the control keeps its own name', async () => {
      const { container } = renderDynamoComponent(OverlayBadgeHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in dot mode', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        OverlayBadgeHostComponent,
      );
      componentInstance.dot.set(true);
      fixture.detectChanges();
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
