import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestKey } from '@angular/cdk/testing';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoSplitter } from './splitter';
import { DynamoSplitterPanel } from './splitter-panel';
import { DynamoSplitterHarness } from './splitter.harness';
import type { DynamoSplitterOrientation } from './splitter.types';

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
    <dg-splitter [orientation]="orientation()" [disabled]="disabled()">
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
  readonly minSizeA = signal(0);
  readonly minSizeB = signal(0);
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

describe('DynamoSplitter', () => {
  describe('creation', () => {
    it('renders each panel\'s projected content and N-1 separators', () => {
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

    it('clamps at the neighboring panel\'s minSize', () => {
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

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(38.33, 1);
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

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(38.33, 1);
    });

    it('ignores the orthogonal arrow keys for the current orientation', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      const divider = separator(container, 0);
      divider.focus();

      fireEvent.keyDown(divider, { key: 'ArrowUp' });
      fixture.detectChanges();

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
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

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
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

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
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

      expect(
        Number(divider.getAttribute('aria-valuenow')),
      ).toBeCloseTo(33.33, 1);
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
      expect(
        Number(divider.getAttribute('aria-valuemax')),
      ).toBeCloseTo(66.67, 1);
    });

    it('shrinks aria-valuemax to the neighboring panel\'s minSize headroom', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitterTestHostComponent,
      );
      fixture.componentInstance.minSizeB.set(20);
      fixture.detectChanges();

      const divider = separator(container, 0);
      expect(
        Number(divider.getAttribute('aria-valuemax')),
      ).toBeCloseTo(46.67, 1);
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(SplitterTestHostComponent);
      await expectNoA11yViolations(container);
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
});
