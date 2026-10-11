import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoToolbar } from './toolbar';
import { DynamoToolbarHarness } from './toolbar.harness';

@Component({
  selector: 'dg-toolbar-test-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar ariaLabel="Document actions">
      <span start>Title</span>
      <span center>Search</span>
      <button end type="button">Save</button>
    </dg-toolbar>
  `,
})
class ToolbarTestHostComponent {}

@Component({
  selector: 'dg-toolbar-start-only-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar>
      <span start>Title</span>
    </dg-toolbar>
  `,
})
class ToolbarStartOnlyHostComponent {}

@Component({
  selector: 'dg-toolbar-buttons-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar ariaLabel="Document actions">
      <button start type="button">New</button>
      <button start type="button" disabled>Open</button>
      <button center type="button">Search</button>
      <button end type="button">Share</button>
      <button end type="button">Save</button>
    </dg-toolbar>
  `,
})
class ToolbarButtonsHostComponent {}

@Component({
  selector: 'dg-toolbar-mixed-controls-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar ariaLabel="Mixed">
      <button start type="button">New</button>
      <input center type="text" value="search text" />
      <select end>
        <option>A</option>
        <option>B</option>
      </select>
      <button end type="button">Save</button>
    </dg-toolbar>
  `,
})
class ToolbarMixedControlsHostComponent {}

describe('DynamoToolbar', () => {
  describe('creation', () => {
    it('renders a role="toolbar" element with start/center/end slots', () => {
      const { container } = renderDynamoComponent(DynamoToolbar);

      expect(within(container).getByRole('toolbar')).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-start"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-center"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-end"]'),
      ).toBeTruthy();
    });
  });

  describe('content projection', () => {
    it('projects content with [start]/[center]/[end] attributes into the matching slot', () => {
      const { container } = renderDynamoComponent(ToolbarTestHostComponent);

      const start = container.querySelector(
        '[data-testid="DynamoToolbar-start"]',
      );
      const center = container.querySelector(
        '[data-testid="DynamoToolbar-center"]',
      );
      const end = container.querySelector('[data-testid="DynamoToolbar-end"]');
      expect(start?.textContent?.trim()).toBe('Title');
      expect(center?.textContent?.trim()).toBe('Search');
      expect(end?.textContent?.trim()).toBe('Save');
    });

    it('renders an empty slot with no stray content when nothing is projected into it', () => {
      const { container } = renderDynamoComponent(
        ToolbarStartOnlyHostComponent,
      );

      const center = container.querySelector(
        '[data-testid="DynamoToolbar-center"]',
      );
      expect(center?.textContent?.trim()).toBe('');
    });
  });

  describe('roving-tabindex keyboard navigation', () => {
    function getButtons(container: HTMLElement): HTMLButtonElement[] {
      return Array.from(container.querySelectorAll('button'));
    }

    it('seeds the first enabled candidate to tabindex=0 and every other one to -1', () => {
      const { container } = renderDynamoComponent(ToolbarButtonsHostComponent);

      const buttons = getButtons(container);
      expect(buttons.map((b) => b.getAttribute('tabindex'))).toEqual([
        '0',
        null, // disabled "Open" is excluded from the roving set entirely
        '-1',
        '-1',
        '-1',
      ]);
    });

    it('ArrowRight moves to the next candidate across start/center/end, skipping the disabled one, and wraps at the end', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarButtonsHostComponent,
      );
      const [newBtn, , searchBtn, shareBtn, saveBtn] = getButtons(container);

      newBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(searchBtn);
      expect(searchBtn?.getAttribute('tabindex')).toBe('0');
      expect(newBtn?.getAttribute('tabindex')).toBe('-1');

      searchBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(shareBtn);

      shareBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(saveBtn);

      saveBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(newBtn);
    });

    it('ArrowLeft moves to the previous candidate and wraps at the start', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarButtonsHostComponent,
      );
      const [newBtn, , , , saveBtn] = getButtons(container);

      newBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(saveBtn);
    });

    it('Home/End jump to the first/last candidate', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarButtonsHostComponent,
      );
      const [newBtn, , , , saveBtn] = getButtons(container);

      newBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(saveBtn);

      saveBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
      );
      fixture.detectChanges();
      expect(document.activeElement).toBe(newBtn);
    });

    it('clicking (focusin) a non-active candidate promotes it to the roving tab stop', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarButtonsHostComponent,
      );
      const [newBtn, , , shareBtn] = getButtons(container);

      shareBtn?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      fixture.detectChanges();

      expect(shareBtn?.getAttribute('tabindex')).toBe('0');
      expect(newBtn?.getAttribute('tabindex')).toBe('-1');
    });

    it('ignores keys other than Arrow/Home/End — no focus change, no error', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarButtonsHostComponent,
      );
      const [newBtn] = getButtons(container);
      newBtn?.focus();

      newBtn?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(newBtn);
    });

    it('self-heals the invariant if something external resets a candidate tabindex back to default', async () => {
      const { container } = renderDynamoComponent(ToolbarButtonsHostComponent);
      const buttons = getButtons(container);
      const active = buttons.find((b) => b.getAttribute('tabindex') === '0');
      active?.removeAttribute('tabindex');

      // The self-heal runs off a MutationObserver (not Angular change
      // detection — see toolbar.ts's own doc comment for why), whose
      // callback fires as a separate microtask, not synchronously.
      await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

      const stillOnlyOneActive = getButtons(container).filter(
        (b) => b.getAttribute('tabindex') === '0',
      );
      expect(stillOnlyOneActive).toHaveLength(1);
    });

    it('leaves a projected text input alone — ArrowLeft/ArrowRight do not move focus away from it while it is focused', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarMixedControlsHostComponent,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      const newBtn = container.querySelector('button') as HTMLButtonElement;
      input.focus();

      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(input);
      expect(document.activeElement).not.toBe(newBtn);
    });

    it('leaves a projected select alone — Home/End do not move focus away from it while it is focused', () => {
      const { fixture, container } = renderDynamoComponent(
        ToolbarMixedControlsHostComponent,
      );
      const select = container.querySelector('select') as HTMLSelectElement;
      const newBtn = container.querySelector('button') as HTMLButtonElement;
      select.focus();

      select.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(select);
      expect(document.activeElement).not.toBe(newBtn);
    });
  });

  describe('input properties', () => {
    it('falls back aria-label to null when unset', () => {
      const { container } = renderDynamoComponent(DynamoToolbar);

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-label'),
      ).toBeNull();
    });

    it('reflects the provided ariaLabel', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: { ariaLabel: 'Document actions' },
      });

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-label'),
      ).toBe('Document actions');
    });

    it('falls back aria-labelledby to null when unset', () => {
      const { container } = renderDynamoComponent(DynamoToolbar);

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-labelledby'),
      ).toBeNull();
    });

    it('reflects the provided ariaLabelledBy', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: { ariaLabelledBy: 'doc-title' },
      });

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-labelledby'),
      ).toBe('doc-title');
    });
  });

  describe('pt / ariaDescribedby', () => {
    it('merges pt class onto root/start/center/end', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: {
          pt: {
            root: { class: 'pt-root' },
            start: { class: 'pt-start' },
            center: { class: 'pt-center' },
            end: { class: 'pt-end' },
          },
        },
      });

      expect(
        within(container).getByRole('toolbar').classList.contains('pt-root'),
      ).toBe(true);
      expect(
        container
          .querySelector('[data-testid="DynamoToolbar-start"]')
          ?.classList.contains('pt-start'),
      ).toBe(true);
      expect(
        container
          .querySelector('[data-testid="DynamoToolbar-center"]')
          ?.classList.contains('pt-center'),
      ).toBe(true);
      expect(
        container
          .querySelector('[data-testid="DynamoToolbar-end"]')
          ?.classList.contains('pt-end'),
      ).toBe(true);
    });

    it('merges a non-class pt attribute onto root', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: { pt: { root: { 'data-testid-extra': 'root-el' } } },
      });

      expect(
        container.querySelector('[data-testid-extra="root-el"]'),
      ).not.toBeNull();
    });

    it('omits aria-describedby by default, forwards it to the root when set', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: { ariaDescribedby: 'hint-id' },
      });

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(ToolbarTestHostComponent);
      await expectNoA11yViolations(container);
    });
  });

  describe('DynamoToolbarHarness', () => {
    it('reads text from each named slot', async () => {
      const { fixture } = renderDynamoComponent(ToolbarTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoToolbarHarness,
      );

      expect(await harness.getSlotText('start')).toBe('Title');
      expect(await harness.getSlotText('center')).toBe('Search');
      expect(await harness.getSlotText('end')).toBe('Save');
    });
  });
});
