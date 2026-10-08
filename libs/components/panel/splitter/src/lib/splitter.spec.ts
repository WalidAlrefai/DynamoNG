import { Component, EventEmitter, signal } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestKey } from '@angular/cdk/testing';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DynamoSplitter } from './splitter';
import { DynamoSplitterPanel } from './splitter-panel';
import { DynamoSplitterHarness } from './splitter.harness';
import type {
  DynamoSplitterOrientation,
  DynamoSplitterPart,
  DynamoSplitterStateStorage,
} from './splitter.types';
import type { DynamoPassThrough } from '@dynamong/core/api';

// getComputedStyle(...).direction does NOT resolve an inherited dir="rtl"
// here (confirmed during the Slider round), which is exactly why the
// component reads an injected Directionality instead.
const rtlProvider = {
  provide: Directionality,
  useValue: { value: 'rtl', change: new EventEmitter<string>() },
};

function separator(container: HTMLElement, index = 0): HTMLElement {
  const el = within(container).getAllByRole('separator')[index];
  if (!el) {
    throw new Error(`No separator at index ${index}`);
  }
  return el;
}

function mockContainerRect(
  container: HTMLElement,
  width: number,
  height: number,
): void {
  const el = container.querySelector(
    '[data-testid="DynamoSplitter"]',
  ) as HTMLElement;
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => '',
    }) as DOMRect;
}

@Component({
  selector: 'dg-splitter-test-host',
  standalone: true,
  imports: [DynamoSplitter, DynamoSplitterPanel],
  template: `
    <dg-splitter
      [orientation]="orientation()"
      [disabled]="disabled()"
      [step]="step()"
      [ariaDescribedby]="ariaDescribedby()"
      [fluid]="fluid()"
      [pt]="pt()"
      (resizeEnd)="resizeEndSizes.set($event)"
    >
      <dg-splitter-panel [minSize]="minSizeA()">
        <p data-testid="panel-a">Panel A</p>
      </dg-splitter-panel>
      <dg-splitter-panel [minSize]="minSizeB()">
        <p data-testid="panel-b">Panel B</p>
      </dg-splitter-panel>
      <dg-splitter-panel>
        <p data-testid="panel-c">Panel C</p>
      </dg-splitter-panel>
    </dg-splitter>
  `,
})
class SplitterTestHostComponent {
  readonly orientation = signal<DynamoSplitterOrientation>('horizontal');
  readonly disabled = signal(false);
  readonly ariaDescribedby = signal<string | undefined>(undefined);
  readonly fluid = signal(true);
  readonly pt = signal<DynamoPassThrough<DynamoSplitterPart> | undefined>(
    undefined,
  );
  readonly minSizeA = signal(0);
  readonly minSizeB = signal(0);
  readonly step = signal(5);
  readonly resizeEndSizes = signal<number[] | null>(null);
}

@Component({
  selector: 'dg-splitter-single-panel-host',
  standalone: true,
  imports: [DynamoSplitter, DynamoSplitterPanel],
  template: `
    <dg-splitter>
      <dg-splitter-panel>
        <p data-testid="only-panel">Only panel</p>
      </dg-splitter-panel>
    </dg-splitter>
  `,
})
class SplitterSinglePanelHostComponent {}

@Component({
  selector: 'dg-splitter-initial-size-host',
  standalone: true,
  imports: [DynamoSplitter, DynamoSplitterPanel],
  template: `
    <dg-splitter>
      <dg-splitter-panel [initialSize]="30">
        <p>A</p>
      </dg-splitter-panel>
      <dg-splitter-panel [initialSize]="70">
        <p>B</p>
      </dg-splitter-panel>
    </dg-splitter>
  `,
})
class SplitterInitialSizeHostComponent {}

@Component({
  selector: 'dg-splitter-state-key-host',
  standalone: true,
  imports: [DynamoSplitter, DynamoSplitterPanel],
  template: `
    <dg-splitter
      [stateKey]="stateKey()"
      [stateStorage]="stateStorage()"
      [disabled]="disabled()"
    >
      <dg-splitter-panel>
        <p>A</p>
      </dg-splitter-panel>
      <dg-splitter-panel>
        <p>B</p>
      </dg-splitter-panel>
    </dg-splitter>
  `,
})
class SplitterStateKeyHostComponent {
  readonly stateKey = signal<string | undefined>('test-splitter');
  readonly stateStorage = signal<DynamoSplitterStateStorage>('session');
  readonly disabled = signal(false);
}

describe('DynamoSplitter', () => {
  describe('creation', () => {
    it("renders each panel's projected content and N-1 separators", () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);

      expect(within(container).getByTestId('panel-a')).toBeTruthy();
      expect(within(container).getByTestId('panel-b')).toBeTruthy();
      expect(within(container).getByTestId('panel-c')).toBeTruthy();
      expect(within(container).getAllByRole('separator')).toHaveLength(2);
    });
  });

  describe('default behavior', () => {
    it('splits panels evenly when no initialSize is given', () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);

      // aria-valuenow on divider i reflects panel i's own size (the panel
      // immediately before it), not a cumulative offset from the start.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
      expect(
        Number(separator(container, 1).getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
    });

    it('respects explicit initialSize and normalizes to 100', () => {
      const { container } = renderDynamoComponent(
        SplitterInitialSizeHostComponent,
      );

      const separator = within(container).getByRole('separator');
      expect(separator.getAttribute('aria-valuenow')).toBe('30');
    });
  });

  describe('pointer interaction', () => {
    it('resizes the two adjacent panels reciprocally when dragging', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fixture.detectChanges();

      // +10% to the first panel, -10% from the second; the third is untouched.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(43.33, 1);
    });

    it("clamps at the neighboring panel's minSize", () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.minSizeB.set(20);
      fixture.detectChanges();
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      // A huge drag that would otherwise push panel B far past its minSize.
      fireEvent.pointerMove(divider, { clientX: 400 });
      fixture.detectChanges();

      // Panel A + Panel B combined stay ~66.67; B floors at 20, so A caps at ~46.67.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(46.67, 1);
    });

    it('emits resizeEnd with the full sizes array on pointerup after a drag', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      const sizes = fixture.componentInstance.resizeEndSizes();
      expect(sizes?.[0]).toBeCloseTo(43.33, 1);
    });

    it('does not emit resizeEnd from a pointerup with no preceding drag', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);

      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      expect(fixture.componentInstance.resizeEndSizes()).toBeNull();
    });

    it('stops responding to pointermove after pointerup', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerUp(divider);
      fireEvent.pointerMove(divider, { clientX: 200 });
      fixture.detectChanges();

      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
    });

    it('ignores pointer drags while disabled', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 200 });
      fixture.detectChanges();

      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
    });

    it('stops resizing from further pointermove once disabled flips true mid-drag, keeping the partial size already applied', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fixture.detectChanges();
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(43.33, 1);

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      // A captured pointer keeps delivering pointermove even though the
      // divider's own pointer-events:none now applies — this is exactly the
      // scenario the disabled() guard inside onDividerPointerMove covers.
      fireEvent.pointerMove(divider, { clientX: 250 });
      fixture.detectChanges();

      // Unchanged from the mid-drag value, not rolled back to the original
      // 33.33 and not advanced to reflect the post-disable move.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(43.33, 1);
    });

    it('ends the drag on pointercancel exactly like pointerup, and ignores any further pointermove', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fireEvent.pointerCancel(divider);
      fixture.detectChanges();
      // pointercancel commits whatever was dragged so far, same as pointerup.
      expect(fixture.componentInstance.resizeEndSizes()?.[0]).toBeCloseTo(
        43.33,
        1,
      );

      fireEvent.pointerMove(divider, { clientX: 200 });
      fixture.detectChanges();

      // The move after pointercancel has no effect — drag state was cleared.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(43.33, 1);
    });
  });

  describe('RTL', () => {
    it('dragging toward the physical right shrinks (not grows) the first panel under RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fixture.detectChanges();

      // Mirror image of the LTR case (which grows to 43.33): physically
      // dragging right now grows the panel to the physical left of the
      // divider (the second panel), shrinking the first.
      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(23.33, 1);
    });

    it('leaves vertical dragging unaffected by RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      mockContainerRect(container, 0, 300);
      const divider = separator(container, 0);

      fireEvent.pointerDown(divider, { clientY: 100 });
      fireEvent.pointerMove(divider, { clientY: 130 });
      fixture.detectChanges();

      expect(
        Number(separator(container, 0).getAttribute('aria-valuenow')),
      ).toBeCloseTo(43.33, 1);
    });

    it('ArrowRight shrinks (not grows) the first panel under RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      // Mirror image of the LTR case (which grows to 38.33).
      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        28.33,
        1,
      );
    });

    it('ArrowLeft grows (not shrinks) the first panel under RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowLeft' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        38.33,
        1,
      );
    });

    it('leaves vertical ArrowUp/ArrowDown unaffected by RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowDown' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        38.33,
        1,
      );
    });

    it('Home/End snap to the physically-mirrored extremes under RTL', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
        { providers: [rtlProvider] },
      );
      const divider = separator(container, 0);
      divider.focus();

      // Mirror image of the LTR case: End now drives the first panel to its
      // own minimum (0) instead of its maximum.
      fireEvent.keyDown(divider, { key: 'End' });
      fixture.detectChanges();
      expect(Number(divider.getAttribute('aria-valuenow'))).toBe(0);

      // ...and Home now drives it to its maximum (66.67) instead.
      fireEvent.keyDown(divider, { key: 'Home' });
      fixture.detectChanges();
      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        66.67,
        1,
      );
    });
  });

  describe('keyboard navigation', () => {
    it('resizes by a fixed step with ArrowLeft/ArrowRight (horizontal)', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        38.33,
        1,
      );
    });

    it('resizes by a fixed step with ArrowUp/ArrowDown (vertical)', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowDown' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        38.33,
        1,
      );
    });

    it('ignores the orthogonal arrow keys for the current orientation', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowUp' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        33.33,
        1,
      );
    });

    it('snaps to the extremes with Home/End', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'End' });
      fixture.detectChanges();
      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        66.67,
        1,
      );

      fireEvent.keyDown(divider, { key: 'Home' });
      fixture.detectChanges();
      expect(Number(divider.getAttribute('aria-valuenow'))).toBe(0);
    });

    it('ignores an unrecognized key', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'a' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        33.33,
        1,
      );
    });

    it('ignores ArrowLeft/ArrowRight while vertical', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        33.33,
        1,
      );
    });

    it('ignores keyboard resizing while disabled', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const divider = separator(container, 0);

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        33.33,
        1,
      );
    });

    it('resizes by a custom step when set', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.step.set(10);
      fixture.detectChanges();
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
        43.33,
        1,
      );
    });

    it('emits resizeEnd with the full sizes array after a keyboard resize', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      const sizes = fixture.componentInstance.resizeEndSizes();
      expect(sizes?.[0]).toBeCloseTo(38.33, 1);
    });

    it('does not emit resizeEnd for an unrecognized or disabled keydown', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const divider = separator(container, 0);

      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      fixture.detectChanges();

      expect(fixture.componentInstance.resizeEndSizes()).toBeNull();
    });

    it('supports interaction through the DynamoSplitterHarness', async () => {
      const { fixture } = renderDynamoComponent(SplitterTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSplitterHarness,
      );

      const initialSizes = await harness.getSizes();
      expect(initialSizes[0]).toBeCloseTo(33.33, 1);

      await harness.focusDivider(0);
      await harness.resizeWithKeyboard(0, TestKey.RIGHT_ARROW);

      const sizes = await harness.getSizes();
      expect(sizes[0]).toBeCloseTo(38.33, 1);
    });

    it('throws from the harness when focusing or resizing a divider that does not exist', async () => {
      const { fixture } = renderDynamoComponent(SplitterTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSplitterHarness,
      );

      await expect(harness.focusDivider(9)).rejects.toThrow(
        'No divider at index 9',
      );
      await expect(
        harness.resizeWithKeyboard(9, TestKey.RIGHT_ARROW),
      ).rejects.toThrow('No divider at index 9');
    });
  });

  describe('accessibility', () => {
    it('sets role, aria-orientation, and aria-valuenow/min/max', () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);

      const divider = separator(container, 0);
      expect(divider.getAttribute('aria-orientation')).toBe('horizontal');
      expect(divider.getAttribute('aria-valuemin')).toBe('0');
      // Max is this pair's combined size (~66.67, panels 0+1 of an even
      // 3-way split) minus panel 1's minSize, not a flat 100 — panel 2's
      // share isn't reachable by this divider (see dividerMax's doc comment).
      expect(Number(divider.getAttribute('aria-valuemax'))).toBeCloseTo(
        66.67,
        1,
      );
    });

    it("shrinks aria-valuemax to the neighboring panel's minSize headroom", () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.minSizeB.set(20);
      fixture.detectChanges();

      const divider = separator(container, 0);
      expect(Number(divider.getAttribute('aria-valuemax'))).toBeCloseTo(
        46.67,
        1,
      );
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);
      await expectNoA11yViolations(container);
    });

    it('forwards ariaDescribedby to every divider', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.ariaDescribedby.set('help-text');
      fixture.detectChanges();

      const dividers = within(container).getAllByRole('separator');
      expect(dividers).toHaveLength(2);
      for (const divider of dividers) {
        expect(divider.getAttribute('aria-describedby')).toBe('help-text');
      }
    });

    it('omits aria-describedby when unset', () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);

      expect(separator(container, 0).hasAttribute('aria-describedby')).toBe(
        false,
      );
    });
  });

  describe('pt passthrough', () => {
    it('merges pt class onto root/panel/divider', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { class: 'pt-root' },
        panel: { class: 'pt-panel' },
        divider: { class: 'pt-divider' },
      });
      fixture.detectChanges();

      expect(
        container
          .querySelector('[data-testid="DynamoSplitter"]')
          ?.classList.contains('pt-root'),
      ).toBe(true);
      expect(container.querySelector('.pt-panel')).not.toBeNull();
      expect(container.querySelector('.pt-divider')).not.toBeNull();
    });

    it('merges a non-class pt attribute onto root/panel/divider', () => {
      // A custom marker attribute, not `data-testid` — the root already
      // carries its own static `data-testid="DynamoSplitter"`, so reusing
      // that key here would just test write-order against the template's
      // own binding rather than the pt-merge mechanism itself.
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { 'data-pt-marker': 'root-el' },
        panel: { 'data-pt-marker': 'panel-el' },
        divider: { 'data-pt-marker': 'divider-el' },
      });
      fixture.detectChanges();

      expect(
        container.querySelectorAll('[data-pt-marker="root-el"]'),
      ).toHaveLength(1);
      expect(
        container.querySelectorAll('[data-pt-marker="panel-el"]'),
      ).toHaveLength(3);
      expect(
        container.querySelectorAll('[data-pt-marker="divider-el"]'),
      ).toHaveLength(2);
    });
  });

  describe('fluid', () => {
    it('defaults to full width', () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);

      const root = container.querySelector('[data-testid="DynamoSplitter"]');
      expect(root?.classList.contains('w-full')).toBe(true);
    });

    it('removes w-full when fluid is false', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.fluid.set(false);
      fixture.detectChanges();

      const root = container.querySelector('[data-testid="DynamoSplitter"]');
      expect(root?.classList.contains('w-full')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('renders a single panel with no dividers, without throwing', () => {
      const { container } = renderDynamoComponent(
        SplitterSinglePanelHostComponent,
      );

      expect(within(container).getByTestId('only-panel')).toBeTruthy();
      expect(within(container).queryAllByRole('separator')).toHaveLength(0);
    });
  });

  describe('stateKey', () => {
    // jsdom's localStorage/sessionStorage persist across tests in the same
    // file otherwise.
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('does not touch storage when stateKey is unset (regression)', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = separator(container, 0);
      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });

    it('does not emit resizeEnd or persist sizes when disabled flips true mid-drag, even on a later pointerup', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = within(container).getByRole('separator');

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fixture.detectChanges();
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      expect(sessionStorage.getItem('test-splitter')).toBeNull();
    });

    it('restores sizes from storage on mount instead of the default even split', () => {
      sessionStorage.setItem('test-splitter', JSON.stringify([20, 80]));

      const { container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );

      const divider = within(container).getByRole('separator');
      expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(20, 1);
    });

    it.each([
      ['missing key', undefined],
      ['malformed JSON', 'not-json'],
      [
        'wrong length (stale, saved with a different panel count)',
        JSON.stringify([10, 20, 70]),
      ],
      ['non-finite values', JSON.stringify([Number.NaN, 100])],
    ])(
      'falls back to the default even split when the stored value is %s',
      (_label, stored) => {
        if (stored !== undefined) {
          sessionStorage.setItem('test-splitter', stored);
        }

        const { container } = renderDynamoComponent(
          SplitterStateKeyHostComponent,
        );

        const divider = within(container).getByRole('separator');
        expect(Number(divider.getAttribute('aria-valuenow'))).toBeCloseTo(
          50,
          1,
        );
      },
    );

    it('persists sizes to sessionStorage after a pointer drag completes', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );
      mockContainerRect(container, 300, 0);
      const divider = within(container).getByRole('separator');

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      const saved = JSON.parse(sessionStorage.getItem('test-splitter') ?? '[]');
      expect(saved[0]).toBeCloseTo(60, 1);
      expect(localStorage.length).toBe(0);
    });

    it('persists to localStorage instead when stateStorage is "local"', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );
      fixture.componentInstance.stateStorage.set('local');
      fixture.detectChanges();
      mockContainerRect(container, 300, 0);
      const divider = within(container).getByRole('separator');

      fireEvent.pointerDown(divider, { clientX: 100 });
      fireEvent.pointerMove(divider, { clientX: 130 });
      fireEvent.pointerUp(divider);
      fixture.detectChanges();

      expect(localStorage.getItem('test-splitter')).not.toBeNull();
      expect(sessionStorage.length).toBe(0);
    });

    it('persists sizes after a keyboard resize completes', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );
      const divider = within(container).getByRole('separator');
      divider.focus();

      fireEvent.keyDown(divider, { key: 'End' });
      fixture.detectChanges();

      const saved = JSON.parse(sessionStorage.getItem('test-splitter') ?? '[]');
      expect(saved[0]).toBeCloseTo(100, 1);
    });

    it('has no axe violations with stateKey set', async () => {
      const { container } = renderDynamoComponent(
        SplitterStateKeyHostComponent,
      );
      await expectNoA11yViolations(container);
    });
  });
});
