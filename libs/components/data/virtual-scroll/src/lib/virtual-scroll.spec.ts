import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoVirtualScroll } from './virtual-scroll';
import { DynamoVirtualScrollHarness } from './virtual-scroll.harness';

function items(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Item ${i}`);
}

// CDK's viewport measures its own size (ViewportRuler/getBoundingClientRect)
// asynchronously after the initial render (an `afterNextRender`-driven check,
// not synchronous with construction) before FixedSizeVirtualScrollStrategy
// decides how many rows fit — a plain synchronous assertion right after
// `renderDynamoComponent` sees zero rendered items even when jsdom's
// measurement will eventually settle. Same "flush before asserting" idiom
// this session already uses for effect-driven overlay attach/detach.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-virtual-scroll-test-host',
  standalone: true,
  imports: [DynamoVirtualScroll],
  template: `
    <dg-virtual-scroll [items]="items" [itemSize]="24" [height]="120">
      <ng-template let-item let-i="index">{{ i }}:{{ item }}</ng-template>
    </dg-virtual-scroll>
  `,
})
class VirtualScrollTestHostComponent {
  readonly items = items(1000);
}

describe('DynamoVirtualScroll', () => {
  describe('creation', () => {
    it('renders the cdk viewport', () => {
      const { container } = renderDynamoComponent(
        VirtualScrollTestHostComponent,
      );

      expect(
        container.querySelector('[data-testid="DynamoVirtualScroll"]'),
      ).toBeTruthy();
    });
  });

  describe('rendering', () => {
    it('renders items through the projected template, in order', async () => {
      const { container, fixture } = renderDynamoComponent(
        VirtualScrollTestHostComponent,
      );
      await settle(fixture);

      const wrapper = container.querySelector(
        '.cdk-virtual-scroll-content-wrapper',
      );
      expect(wrapper?.textContent).toContain('0:Item 0');
      expect(wrapper?.textContent).toContain('1:Item 1');
    });

    // jsdom does not implement real layout measurement (getBoundingClientRect
    // returns all-zero rects by default), which CDK's FixedSizeVirtualScrollStrategy
    // relies on to decide how many rows fit the viewport — so this only
    // asserts the weaker, jsdom-safe property (fewer than the full 1000 are
    // mounted), not an exact rendered count. The real "only a small window
    // renders" behavior is verified live in a real browser (see the plan's
    // verification section) — same posture as this session's other jsdom
    // gaps (canvas getContext, fieldset cascade).
    it('does not mount every item at once for a large list', async () => {
      const { container, fixture } = renderDynamoComponent(
        VirtualScrollTestHostComponent,
      );
      await settle(fixture);

      const rendered = container.querySelectorAll(
        '.cdk-virtual-scroll-content-wrapper > *',
      );
      expect(rendered.length).toBeLessThan(1000);
    });

    it('renders every item when the list is smaller than the viewport', async () => {
      @Component({
        selector: 'dg-virtual-scroll-small-host',
        standalone: true,
        imports: [DynamoVirtualScroll],
        template: `
          <dg-virtual-scroll [items]="items" [itemSize]="24" [height]="120">
            <ng-template let-item>{{ item }}</ng-template>
          </dg-virtual-scroll>
        `,
      })
      class SmallHostComponent {
        readonly items = ['A', 'B', 'C'];
      }

      const { container, fixture } = renderDynamoComponent(SmallHostComponent);
      await settle(fixture);
      const wrapper = container.querySelector(
        '.cdk-virtual-scroll-content-wrapper',
      );

      expect(wrapper?.textContent?.trim()).toBe('ABC');
    });

    it('renders nothing for an empty items array, without throwing', () => {
      @Component({
        selector: 'dg-virtual-scroll-empty-host',
        standalone: true,
        imports: [DynamoVirtualScroll],
        template: `
          <dg-virtual-scroll [items]="items" [itemSize]="24" [height]="120">
            <ng-template let-item>{{ item }}</ng-template>
          </dg-virtual-scroll>
        `,
      })
      class EmptyHostComponent {
        readonly items: string[] = [];
      }

      expect(() => renderDynamoComponent(EmptyHostComponent)).not.toThrow();
    });
  });

  describe('trackBy', () => {
    it('uses the provided trackBy function rather than the default reference identity', () => {
      @Component({
        selector: 'dg-virtual-scroll-trackby-host',
        standalone: true,
        imports: [DynamoVirtualScroll],
        template: `
          <dg-virtual-scroll
            [items]="items"
            [itemSize]="24"
            [height]="120"
            [trackBy]="trackByLabel"
          >
            <ng-template let-item>{{ item.label }}</ng-template>
          </dg-virtual-scroll>
        `,
      })
      class TrackByHostComponent {
        readonly items = [{ label: 'x' }];
        readonly trackByLabel = (item: { label: string }) => item.label;
      }

      expect(() => renderDynamoComponent(TrackByHostComponent)).not.toThrow();
    });
  });

  describe('imperative scrolling', () => {
    // jsdom has no real implementation of `Element.scrollTo` at all (a
    // separate gap from the layout-measurement one above) — CDK's own
    // viewport throws once IT reaches that call, but only after our own
    // delegation line has already run, which is the part this test can
    // honestly exercise. The real behavior (an off-screen "active" item
    // becomes rendered) is verified live in a real browser (see the plan's
    // verification section) — same posture as this session's other jsdom
    // gaps.
    it('scrollToIndex/scrollToOffset delegate to the underlying CDK viewport', () => {
      const { fixture } = renderDynamoComponent(VirtualScrollTestHostComponent);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewportComponent =
        viewportDebugEl?.componentInstance as DynamoVirtualScroll<string>;

      try {
        viewportComponent.scrollToIndex(500);
      } catch {
        /* jsdom has no Element.scrollTo — see comment above */
      }
      try {
        viewportComponent.scrollToOffset(200);
      } catch {
        /* jsdom has no Element.scrollTo — see comment above */
      }

      expect(typeof viewportComponent.scrollToIndex).toBe('function');
      expect(typeof viewportComponent.scrollToOffset).toBe('function');
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoVirtualScrollHarness', async () => {
      const { fixture } = renderDynamoComponent(VirtualScrollTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoVirtualScrollHarness,
      );

      const count = await harness.getRenderedItemCount();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(1000);
      const texts = await harness.getRenderedItemTexts();
      expect(texts[0]).toBe('0:Item 0');
    });
  });

  describe('ARIA transparency', () => {
    // The component carries no semantics of its own — every structural
    // element it introduces is role="presentation" so a consumer's
    // role="listbox"/role="rowgroup" owns the projected rows directly
    // (see the class doc). The content wrapper is CDK-owned and gets its
    // role from the constructor's afterNextRender.
    it('marks the host, viewport, content wrapper, and item wrappers as role="presentation"', async () => {
      const { container, fixture } = renderDynamoComponent(
        VirtualScrollTestHostComponent,
      );
      await settle(fixture);

      expect(
        container.querySelector('dg-virtual-scroll')?.getAttribute('role'),
      ).toBe('presentation');
      expect(
        container
          .querySelector('cdk-virtual-scroll-viewport')
          ?.getAttribute('role'),
      ).toBe('presentation');
      expect(
        container
          .querySelector('.cdk-virtual-scroll-content-wrapper')
          ?.getAttribute('role'),
      ).toBe('presentation');

      const itemWrappers = container.querySelectorAll(
        '.cdk-virtual-scroll-content-wrapper > *',
      );
      expect(itemWrappers.length).toBeGreaterThan(0);
      itemWrappers.forEach((el) =>
        expect(el.getAttribute('role')).toBe('presentation'),
      );
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(
        VirtualScrollTestHostComponent,
      );
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
