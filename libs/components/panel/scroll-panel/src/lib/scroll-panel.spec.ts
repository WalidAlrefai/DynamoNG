import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFadeGradient,
  computeThumbGeometry,
} from './scroll-panel-geometry';
import { DynamoScrollPanel } from './scroll-panel';
import { DynamoScrollPanelHarness } from './scroll-panel.harness';
import type { DynamoScrollPanelMetrics } from './scroll-panel.types';

// `afterNextRender`'s callback (where the scroll listener/ResizeObserver
// are set up and the first metrics read happens) runs asynchronously after
// the initial render, not synchronously with construction — same
// "flush before asserting" idiom already used by DynamoVirtualScroll's own
// spec for the identical afterNextRender-driven-setup reason.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

// The scroll listener now batches metrics recomputation to at most once per
// animation frame (see scroll-panel.ts's scheduleRecompute) — every test
// that fires a native `scroll` event must flush a real animation frame
// before asserting on the resulting metrics-derived state.
async function scrollAndFlush(
  viewport: HTMLElement,
  fixture: ComponentFixture<unknown>,
): Promise<void> {
  fireEvent.scroll(viewport);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  fixture.detectChanges();
}

function viewportEl(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-testid="dg-scroll-panel-viewport"]',
  ) as HTMLElement;
}

// jsdom's getBoundingClientRect() always returns all-zero — same limitation
// mockScrollMetrics works around for scroll/client dimensions — so track
// click tests need their own rect stub to give the click a non-zero origin.
function mockRect(el: HTMLElement, rect: Partial<DOMRect>): void {
  el.getBoundingClientRect = () => rect as DOMRect;
}

// Element.scrollTo's real signature is overloaded ((options?) | (x, y)),
// which TS can't narrow a plain options-only stub against directly.
function stubScrollTo(
  el: HTMLElement,
  handler: (options: ScrollToOptions) => void,
): void {
  (el as unknown as { scrollTo: (options: ScrollToOptions) => void }).scrollTo =
    handler;
}

// jsdom has no layout engine — scrollHeight/clientHeight/scrollWidth/
// clientWidth always read 0, and assigning .scrollTop/.scrollLeft never
// dispatches a native `scroll` event (both same category of jsdom
// limitation as Splitter's own `mockContainerRect` helper). Metrics are
// overridden directly; callers fire a `scroll` event afterward to make the
// component pick the new values up.
function mockScrollMetrics(
  el: HTMLElement,
  metrics: Partial<DynamoScrollPanelMetrics>,
): void {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(el, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
}

@Component({
  selector: 'dg-scroll-panel-test-host',
  standalone: true,
  imports: [DynamoScrollPanel],
  template: `
    <dg-scroll-panel styleClass="h-32 w-32">
      <p data-testid="content">Content</p>
    </dg-scroll-panel>
  `,
})
class ScrollPanelTestHostComponent {}

describe('DynamoScrollPanel', () => {
  describe('creation', () => {
    it('renders projected content', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(within(container).getByTestId('content')).toBeTruthy();
    });

    it('renders no thumbs when content does not overflow', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeNull();
    });
  });

  describe('thumb visibility', () => {
    it('shows only the vertical thumb when only the Y axis overflows', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 100,
        clientWidth: 100,
      });
      await scrollAndFlush(viewport, fixture);

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeNull();
    });

    it('shows only the horizontal thumb when only the X axis overflows', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 100,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      await scrollAndFlush(viewport, fixture);

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeNull();
    });

    it('shows both thumbs when both axes overflow', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      await scrollAndFlush(viewport, fixture);

      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-x"]'),
      ).toBeTruthy();
    });
  });

  describe('thumb size/position', () => {
    it('sizes and positions the vertical thumb proportionally to scroll progress', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 50,
      });
      await scrollAndFlush(viewport, fixture);

      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      // size = clientHeight/scrollHeight = 100/200 = 50%.
      expect(thumbY.style.height).toBe('50%');
      // maxScrollTop = 200-100 = 100; posPct = (50/100)*(100-50) = 25%.
      expect(thumbY.style.top).toBe('25%');
    });

    it('sizes and positions the horizontal thumb proportionally to scroll progress', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 50,
      });
      await scrollAndFlush(viewport, fixture);

      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;
      expect(thumbX.style.width).toBe('50%');
      expect(thumbX.style.left).toBe('25%');
    });

    it('updates thumb position on a plain native scroll with no drag involved', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      expect(thumbY.style.top).toBe('0%');

      mockScrollMetrics(viewport, { scrollTop: 100 });
      await scrollAndFlush(viewport, fixture);

      expect(thumbY.style.top).toBe('50%');
    });
  });

  describe('drag', () => {
    it('dragging the vertical thumb sets scrollTop proportionally', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbY, { clientY: 100 });
      fireEvent.pointerMove(thumbY, { clientY: 150 });

      // trackLength = clientHeight = 100; thumbLengthPx = (100/200)*100 = 50;
      // travelPx = 50; maxScrollTop = 100; deltaPx = 50 -> deltaScrollTop = 100.
      expect(viewport.scrollTop).toBe(100);
    });

    it('dragging the horizontal thumb sets scrollLeft proportionally', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbX, { clientX: 100 });
      fireEvent.pointerMove(thumbX, { clientX: 150 });

      expect(viewport.scrollLeft).toBe(100);
    });

    it('stops responding to pointermove after pointerup (vertical)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbY, { clientY: 100 });
      fireEvent.pointerUp(thumbY);
      fireEvent.pointerMove(thumbY, { clientY: 200 });

      expect(viewport.scrollTop).toBe(0);
    });

    it('stops responding to pointermove after pointerup (horizontal)', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 200,
        clientWidth: 100,
        scrollLeft: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbX = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-x"]',
      ) as HTMLElement;

      fireEvent.pointerDown(thumbX, { clientX: 100 });
      fireEvent.pointerUp(thumbX);
      fireEvent.pointerMove(thumbX, { clientX: 200 });

      expect(viewport.scrollLeft).toBe(0);
    });
  });

  describe('ResizeObserver integration', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('observes both the viewport and content elements when ResizeObserver is available', async () => {
      const observed: unknown[] = [];
      class FakeResizeObserver {
        observe(target: unknown): void {
          observed.push(target);
        }
        unobserve(): void {
          /* no-op */
        }
        disconnect(): void {
          /* no-op */
        }
      }
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);

      const { fixture } = renderDynamoComponent(ScrollPanelTestHostComponent);
      await settle(fixture);

      expect(observed).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('has no tabindex when not scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(viewportEl(container).getAttribute('tabindex')).toBeNull();
    });

    it('gets a tabindex once it becomes scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, { scrollHeight: 200, clientHeight: 100 });
      await scrollAndFlush(viewport, fixture);

      expect(viewport.getAttribute('tabindex')).toBe('0');
    });

    it('marks both thumbs aria-hidden', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      await scrollAndFlush(viewport, fixture);

      expect(
        container
          .querySelector('[data-testid="dg-scroll-panel-thumb-y"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(
        container
          .querySelector('[data-testid="dg-scroll-panel-thumb-x"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
    });

    it('has no axe violations when not scrollable', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when scrollable with both thumbs shown', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollWidth: 200,
        clientWidth: 100,
      });
      await scrollAndFlush(viewport, fixture);

      await expectNoA11yViolations(container);
    });
  });

  describe('harness', () => {
    it('reports scroll position and per-axis thumb presence', async () => {
      const { fixture, container } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 40,
      });
      await scrollAndFlush(viewport, fixture);

      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoScrollPanelHarness,
      );

      expect(await harness.getScrollTop()).toBe(40);
      expect(await harness.getScrollLeft()).toBe(0);
      expect(await harness.hasVerticalThumb()).toBe(true);
      expect(await harness.hasHorizontalThumb()).toBe(false);
    });
  });

  describe('minimum thumb size clamp', () => {
    it('does not clamp a thumb that is already above the minimum', () => {
      const geometry = computeThumbGeometry(100, 50, 100, 0, 24);
      expect(geometry.sizePx).toBe(50);
    });

    it('clamps a thumb that would otherwise shrink below the minimum', () => {
      // Without a clamp: (10/1000)*100 = 1px, far below the 24px floor.
      const geometry = computeThumbGeometry(100, 10, 1000, 0, 24);
      expect(geometry.sizePx).toBe(24);
      expect(geometry.sizePct).toBe(24);
    });

    it('renders a visually clamped thumb at the minimum size', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 10000,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);

      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      // Raw ratio would be (100/10000)*100 = 1%; clamped to 24px of a
      // 100px track = 24%.
      expect(thumbY.style.height).toBe('24%');
    });

    it('drags proportionally to the clamped thumb size, not the raw ratio', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 10000,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      // thumbLengthPx clamped to 24; travelPx = 100-24 = 76;
      // maxScrollTop = 9900; deltaPx = 76 -> deltaScrollTop = 9900.
      fireEvent.pointerDown(thumbY, { clientY: 0 });
      fireEvent.pointerMove(thumbY, { clientY: 76 });

      expect(viewport.scrollTop).toBe(9900);
    });
  });

  describe('click-on-track paging', () => {
    it('pages down when the vertical track is clicked below the thumb', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 400,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const trackY = container.querySelector(
        '[data-testid="dg-scroll-panel-track-y"]',
      ) as HTMLElement;
      mockRect(trackY, { top: 0, left: 0 } as DOMRect);
      // thumb: size=(100/400)*100=25px, top=0 -> centered at 12.5px.
      // A click well below it should page forward one clientHeight.
      fireEvent.pointerDown(trackY, { clientY: 90 });

      expect(viewport.scrollTop).toBe(100);
    });

    it('pages up when the vertical track is clicked above the thumb', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 400,
        clientHeight: 100,
        scrollTop: 300,
      });
      await scrollAndFlush(viewport, fixture);
      const trackY = container.querySelector(
        '[data-testid="dg-scroll-panel-track-y"]',
      ) as HTMLElement;
      mockRect(trackY, { top: 0, left: 0 } as DOMRect);
      // thumb is now pinned at the bottom; a click near the top should
      // page backward one clientHeight.
      fireEvent.pointerDown(trackY, { clientY: 5 });

      expect(viewport.scrollTop).toBe(200);
    });

    it('pages the horizontal track toward the click', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 400,
        clientWidth: 100,
        scrollLeft: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const trackX = container.querySelector(
        '[data-testid="dg-scroll-panel-track-x"]',
      ) as HTMLElement;
      mockRect(trackX, { top: 0, left: 0 } as DOMRect);
      fireEvent.pointerDown(trackX, { clientX: 90 });

      expect(viewport.scrollLeft).toBe(100);
    });

    it('pressing down on the thumb itself does not page the track', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 400,
        clientHeight: 100,
        scrollTop: 0,
      });
      await scrollAndFlush(viewport, fixture);
      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;

      // The thumb and track are separate sibling elements, so a pointerdown
      // that hits the (topmost) thumb never reaches the track underneath —
      // this only starts a drag (handled elsewhere), never a page.
      fireEvent.pointerDown(thumbY, { clientY: 5 });

      expect(viewport.scrollTop).toBe(0);
    });
  });

  describe('imperative scroll API', () => {
    it('scrollToTop scrolls the viewport to the top', async () => {
      const { fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const panel = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoScrollPanel,
      ).componentInstance as DynamoScrollPanel;
      const viewport = viewportEl(fixture.nativeElement);
      mockScrollMetrics(viewport, {
        scrollHeight: 400,
        clientHeight: 100,
        scrollTop: 200,
      });
      stubScrollTo(viewport, ({ top }) => {
        Object.defineProperty(viewport, 'scrollTop', {
          value: top,
          configurable: true,
        });
      });

      panel.scrollToTop();

      expect(viewport.scrollTop).toBe(0);
    });

    it('scrollToBottom scrolls the viewport to scrollHeight - clientHeight', async () => {
      const { fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const panel = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoScrollPanel,
      ).componentInstance as DynamoScrollPanel;
      const viewport = viewportEl(fixture.nativeElement);
      mockScrollMetrics(viewport, { scrollHeight: 400, clientHeight: 100 });
      await scrollAndFlush(viewport, fixture);
      let scrolledTo: ScrollToOptions | undefined;
      stubScrollTo(viewport, (options) => {
        scrolledTo = options;
      });

      panel.scrollToBottom();

      expect(scrolledTo).toEqual({ top: 300, behavior: 'auto' });
    });

    it('scrollToStart and scrollToEnd scroll the horizontal axis', async () => {
      const { fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const panel = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoScrollPanel,
      ).componentInstance as DynamoScrollPanel;
      const viewport = viewportEl(fixture.nativeElement);
      mockScrollMetrics(viewport, { scrollWidth: 400, clientWidth: 100 });
      await scrollAndFlush(viewport, fixture);
      const calls: ScrollToOptions[] = [];
      stubScrollTo(viewport, (options) => {
        calls.push(options);
      });

      panel.scrollToStart();
      panel.scrollToEnd();

      expect(calls).toEqual([
        { left: 0, behavior: 'auto' },
        { left: 300, behavior: 'auto' },
      ]);
    });

    it('scrollTo delegates directly to the native viewport', async () => {
      const { fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const panel = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoScrollPanel,
      ).componentInstance as DynamoScrollPanel;
      const viewport = viewportEl(fixture.nativeElement);
      let scrolledTo: ScrollToOptions | undefined;
      stubScrollTo(viewport, (options) => {
        scrolledTo = options;
      });

      panel.scrollTo({ top: 42, behavior: 'smooth' });

      expect(scrolledTo).toEqual({ top: 42, behavior: 'smooth' });
    });
  });

  describe('edge fade hint', () => {
    it('builds no gradient when neither edge needs a fade', () => {
      expect(buildFadeGradient(false, false, 'to bottom')).toBeNull();
    });

    it('fades only the trailing edge when scrolled to the start', () => {
      const gradient = buildFadeGradient(false, true, 'to bottom', 24);
      expect(gradient).toBe(
        'linear-gradient(to bottom, black 0, black calc(100% - 24px), transparent 100%)',
      );
    });

    it('fades both edges once scrolled past the start and short of the end', () => {
      const gradient = buildFadeGradient(true, true, 'to bottom', 24);
      expect(gradient).toBe(
        'linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
      );
    });

    it('applies no mask when content does not overflow', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);

      expect(viewportEl(container).style.maskImage).toBe('');
    });

    it('fades the top edge once scrolled past the start', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollHeight: 400,
        clientHeight: 100,
        scrollTop: 50,
      });
      await scrollAndFlush(viewport, fixture);

      expect(viewport.style.maskImage).toContain('transparent 0');
      expect(viewport.style.maskImage).toContain('to bottom');
    });

    it('fades the left edge once scrolled past the start horizontally', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);
      mockScrollMetrics(viewport, {
        scrollWidth: 400,
        clientWidth: 100,
        scrollLeft: 50,
      });
      await scrollAndFlush(viewport, fixture);

      expect(viewport.style.maskImage).toContain('to right');
    });
  });

  describe('scroll performance', () => {
    it('coalesces multiple scroll events into a single recompute per animation frame', async () => {
      const { container, fixture } = renderDynamoComponent(
        ScrollPanelTestHostComponent,
      );
      await settle(fixture);
      const viewport = viewportEl(container);

      mockScrollMetrics(viewport, {
        scrollHeight: 200,
        clientHeight: 100,
        scrollTop: 10,
      });
      fireEvent.scroll(viewport);
      mockScrollMetrics(viewport, { scrollTop: 20 });
      fireEvent.scroll(viewport);
      mockScrollMetrics(viewport, { scrollTop: 30 });
      fireEvent.scroll(viewport);
      fixture.detectChanges();

      // The batched recompute hasn't run yet — metrics (and therefore the
      // thumb) still reflect the pre-scroll, non-overflowing state.
      expect(
        container.querySelector('[data-testid="dg-scroll-panel-thumb-y"]'),
      ).toBeNull();

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      fixture.detectChanges();

      const thumbY = container.querySelector(
        '[data-testid="dg-scroll-panel-thumb-y"]',
      ) as HTMLElement;
      expect(thumbY).toBeTruthy();
      // Only the latest (scrollTop=30) value should have taken effect:
      // maxScrollTop=100; posPct=(30/100)*(100-50)=15.
      expect(thumbY.style.top).toBe('15%');
    });

    it('cancels a pending frame on destroy without throwing', async () => {
      const { fixture } = renderDynamoComponent(ScrollPanelTestHostComponent);
      await settle(fixture);
      const viewport = viewportEl(fixture.nativeElement);
      mockScrollMetrics(viewport, { scrollHeight: 200, clientHeight: 100 });
      fireEvent.scroll(viewport);

      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('renders with no projected content without throwing', async () => {
      await expect(async () => {
        const { fixture } = renderDynamoComponent(DynamoScrollPanel);
        await settle(fixture);
      }).not.toThrow();
    });

    it('emits only styleClass on the root when unstyled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoScrollPanel, {
        inputs: { unstyled: true, styleClass: 'custom-scroll-panel' },
      });
      await settle(fixture);

      expect(
        container.querySelector('[data-testid="DynamoScrollPanel"]')?.className,
      ).toBe('custom-scroll-panel');
    });
  });
});
