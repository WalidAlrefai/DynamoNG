import type { ComponentFixture } from '@angular/core/testing';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { fireEvent, within } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { DynamoPicklist } from './picklist';
import { DynamoPicklistHarness } from './picklist.harness';
import type { DynamoSelectOption } from './picklist.types';

// jsdom has no real `Element.scrollTo`. While `virtualScroll` is enabled,
// Picklist's `scrollActiveIntoView()` reaches the virtual-scroll
// viewport's `scrollToIndex()` (CDK's viewport calls `scrollTo`
// internally) — a minimal stub lets these tests exercise the real
// keyboard-nav-while-virtualized behavior instead of throwing, same gap
// already worked around in `listbox.spec.ts`.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

// jsdom reports a zero-height viewport, so CDK's fixed-size strategy
// renders zero rows synchronously — flush a real setTimeout(0) +
// detectChanges() before asserting on virtualized content.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

const SOURCE: DynamoSelectOption<string>[] = [
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
  { label: 'Python', value: 'py' },
];

const TARGET: DynamoSelectOption<string>[] = [
  { label: 'TypeScript', value: 'ts' },
];

const SOURCE_WITH_DISABLED: DynamoSelectOption<string>[] = [
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go', disabled: true },
  { label: 'Python', value: 'py' },
];

const MANY_SOURCE: DynamoSelectOption<string>[] = Array.from(
  { length: 50 },
  (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }),
);

// "e" matches One/Three but not Two — a clean way to exercise "one item
// hidden between two visible ones" without relying on substrings that
// accidentally match more/fewer items than intended.
const FILTER_SOURCE: DynamoSelectOption<string>[] = [
  { label: 'One', value: '1' },
  { label: 'Two', value: '2' },
  { label: 'Three', value: '3' },
];

function dispatchKey(target: HTMLElement, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

function panelListEl(
  container: HTMLElement,
  side: 'source' | 'target',
): HTMLElement {
  return container.querySelector(
    `[data-part="${side}Panel"] [role="listbox"]`,
  ) as HTMLElement;
}

function panelFilterInput(
  container: HTMLElement,
  side: 'source' | 'target',
): HTMLInputElement {
  return container.querySelector(
    `[data-part="${side}Panel"] input[type="search"]`,
  ) as HTMLInputElement;
}

function panelRowTexts(
  container: HTMLElement,
  side: 'source' | 'target',
): string[] {
  return Array.from(
    container.querySelectorAll(`[data-part="${side}Panel"] [role="option"]`),
  ).map((el) => el.textContent?.trim() ?? '');
}

function dropEvent(
  previousIndex: number,
  currentIndex: number,
  sameContainer: boolean,
): CdkDragDrop<unknown> {
  const container = {};
  const previousContainer = sameContainer ? container : {};
  return {
    previousContainer,
    container,
    previousIndex,
    currentIndex,
  } as unknown as CdkDragDrop<unknown>;
}

describe('DynamoPicklist', () => {
  describe('creation', () => {
    it('renders both panels with their initial content and accessible names', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      expect(
        within(container).getByRole('listbox', { name: 'Available' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('listbox', { name: 'Selected' }),
      ).toBeTruthy();
      expect(
        container.querySelectorAll('[data-part="sourcePanel"] [role="option"]'),
      ).toHaveLength(3);
      expect(
        container.querySelectorAll('[data-part="targetPanel"] [role="option"]'),
      ).toHaveLength(1);
    });

    it('uses custom sourceLabel/targetLabel when provided', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: SOURCE,
          target: TARGET,
          sourceLabel: 'Candidates',
          targetLabel: 'Hired',
        },
      });

      expect(
        within(container).getByRole('listbox', { name: 'Candidates' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('listbox', { name: 'Hired' }),
      ).toBeTruthy();
    });
  });

  describe('checkbox selection', () => {
    it('toggles a source row into sourceSelected independently of target', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();

      const row = within(container).getByRole('option', { name: 'Rust' });
      expect(row.getAttribute('aria-selected')).toBe('true');
      expect(
        within(container)
          .getByRole('option', { name: 'TypeScript' })
          .getAttribute('aria-selected'),
      ).toBe('false');
    });

    it('clicking a checked row unchecks it', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const row = within(container).getByRole('option', { name: 'Rust' });
      row.click();
      fixture.detectChanges();

      row.click();
      fixture.detectChanges();

      expect(row.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('itemSelect', () => {
    it('emits {option, side} on check and uncheck, tagged with the correct panel', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, { inputs: { source: SOURCE, target: TARGET } });
      const emitted: { option: DynamoSelectOption<string>; side: string }[] =
        [];
      componentInstance.itemSelect.subscribe((event) => emitted.push(event));

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container).getByRole('option', { name: 'TypeScript' }).click();
      fixture.detectChanges();
      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();

      expect(emitted).toEqual([
        { option: SOURCE[0], side: 'source' },
        { option: TARGET[0], side: 'target' },
        { option: SOURCE[0], side: 'source' },
      ]);
    });

    it('emits on Enter within a panel', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, { inputs: { source: SOURCE, target: TARGET } });
      const emitted: { option: DynamoSelectOption<string>; side: string }[] =
        [];
      componentInstance.itemSelect.subscribe((event) => emitted.push(event));
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      expect(emitted).toEqual([{ option: SOURCE[0], side: 'source' }]);
    });

    it('does not emit for a disabled option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, {
        inputs: { source: SOURCE_WITH_DISABLED, target: TARGET },
      });
      const emitted: unknown[] = [];
      componentInstance.itemSelect.subscribe((event) => emitted.push(event));

      within(container).getByRole('option', { name: 'Go' }).click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from moving items between panels', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, { inputs: { source: SOURCE, target: TARGET } });
      const emitted: unknown[] = [];
      componentInstance.itemSelect.subscribe((event) => emitted.push(event));

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move selected to Selected' })
        .click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move all to Selected' })
        .click();
      fixture.detectChanges();

      expect(emitted).toEqual([{ option: SOURCE[0], side: 'source' }]);
    });
  });

  describe('move-selected buttons', () => {
    it('moves checked source items to target, preserving relative order, and clears selection', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );
      within(container).getByRole('option', { name: 'Python' }).click();
      fixture.detectChanges();
      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: 'Move selected to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'ts',
        'rust',
        'py',
      ]);
      expect(componentInstance.source().map((o) => o.value)).toEqual(['go']);
      expect(
        within(container)
          .getByRole('button', { name: 'Move selected to Selected' })
          .hasAttribute('disabled'),
      ).toBe(true);
    });

    it('moves checked target items back to source', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );
      within(container).getByRole('option', { name: 'TypeScript' }).click();
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: 'Move selected to Available' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target()).toEqual([]);
      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
        'ts',
      ]);
    });
  });

  describe('move-all buttons', () => {
    it('moves every source item to target regardless of selection', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );

      within(container)
        .getByRole('button', { name: 'Move all to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.source()).toEqual([]);
      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'ts',
        'rust',
        'go',
        'py',
      ]);
    });

    it('moves every target item back to source', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );

      within(container)
        .getByRole('button', { name: 'Move all to Available' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target()).toEqual([]);
      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
        'ts',
      ]);
    });

    it('disabled items are still swept up by move-all (disabled only blocks checkbox/drag, not bulk move)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE_WITH_DISABLED, target: [] },
        },
      );

      within(container)
        .getByRole('button', { name: 'Move all to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
      ]);
      expect(componentInstance.source()).toEqual([]);
    });
  });

  describe('move-button disabled states', () => {
    it('move-selected-* disabled with nothing checked; move-all-* disabled only when that panel is empty', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: [] },
      });

      expect(
        within(container)
          .getByRole('button', { name: 'Move selected to Selected' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        within(container)
          .getByRole('button', { name: 'Move selected to Available' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        within(container)
          .getByRole('button', { name: 'Move all to Selected' })
          .hasAttribute('disabled'),
      ).toBe(false);
      expect(
        within(container)
          .getByRole('button', { name: 'Move all to Available' })
          .hasAttribute('disabled'),
      ).toBe(true);
    });
  });

  describe('keyboard navigation — per panel independently', () => {
    it('ArrowDown/Home/End move sourceActiveIndex without touching target', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('option', { name: 'Rust' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('End then Home jump to the last/first enabled row and Enter toggles it', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'End');
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();
      expect(
        within(container)
          .getByRole('option', { name: 'Python' })
          .getAttribute('aria-selected'),
      ).toBe('true');

      dispatchKey(sourceList, 'Home');
      dispatchKey(sourceList, ' ');
      fixture.detectChanges();
      expect(
        within(container)
          .getByRole('option', { name: 'Rust' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('ArrowDown skips a disabled row', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE_WITH_DISABLED, target: [] },
      });
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown'); // seeds to Rust (0)
      dispatchKey(sourceList, 'ArrowDown'); // Go (1) is disabled, skip to Python (2)
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('option', { name: 'Python' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('ArrowUp moves backward through the list', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'End'); // active = Python (index 2)
      dispatchKey(sourceList, 'ArrowUp'); // steps back to Go (index 1)
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('option', { name: 'Go' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('an unhandled key is a no-op', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );

      dispatchKey(panelListEl(container, 'source'), 'Tab');
      fixture.detectChanges();

      expect(componentInstance.source()).toEqual(SOURCE);
    });

    it('keyboard nav on an empty panel does not throw', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: [], target: [] },
      });
      const sourceList = panelListEl(container, 'source');

      expect(() => {
        dispatchKey(sourceList, 'ArrowDown');
        dispatchKey(sourceList, 'Enter');
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('ArrowDown on an all-disabled panel leaves nothing active', () => {
      const allDisabled = SOURCE.map((o) => ({ ...o, disabled: true }));
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: allDisabled, target: [] },
      });
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown');
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      for (const option of SOURCE) {
        expect(
          within(container)
            .getByRole('option', { name: option.label })
            .getAttribute('aria-selected'),
        ).toBe('false');
      }
    });
  });

  describe('keyboard reorder buttons', () => {
    it('move-down swaps a targeted row forward one position, move-up swaps it back', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: [], target: SOURCE },
        },
      );
      const targetList = panelListEl(container, 'target');
      dispatchKey(targetList, 'ArrowDown'); // active = Rust (index 0)
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: 'Move down in Selected' })
        .click();
      fixture.detectChanges();
      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'go',
        'rust',
        'py',
      ]);

      within(container)
        .getByRole('button', { name: 'Move up in Selected' })
        .click();
      fixture.detectChanges();
      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
      ]);
    });

    it('move-up is disabled at index 0 and with no active row; move-down disabled at the last index', () => {
      const { fixture, container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: [], target: SOURCE },
      });
      expect(
        within(container)
          .getByRole('button', { name: 'Move up in Selected' })
          .hasAttribute('disabled'),
      ).toBe(true);

      const targetList = panelListEl(container, 'target');
      dispatchKey(targetList, 'End'); // active = last row
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Move down in Selected' })
          .hasAttribute('disabled'),
      ).toBe(true);
    });

    it('reordering within target never touches source', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET },
        },
      );
      const targetList = panelListEl(container, 'target');
      dispatchKey(targetList, 'ArrowDown');
      fixture.detectChanges();

      const sourceBefore = componentInstance.source();
      within(container)
        .getByRole('button', { name: 'Move down in Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.source()).toBe(sourceBefore);
    });
  });

  describe('drag and drop', () => {
    // jsdom/vitest can't simulate real HTML5 drag gestures — same class of
    // workaround as Slider's getBoundingClientRect mocking — so the drop
    // handler is invoked directly with a constructed CdkDragDrop-shaped
    // event object.
    it('same-container drop reorders within one panel via moveItemInArray semantics', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      (
        componentInstance as unknown as {
          onDropped: (
            e: CdkDragDrop<unknown>,
            side: 'source' | 'target',
          ) => void;
        }
      ).onDropped(dropEvent(0, 2, true), 'source');

      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'go',
        'py',
        'rust',
      ]);
      expect(componentInstance.target().map((o) => o.value)).toEqual(['ts']);
    });

    it('cross-container drop transfers the item at previousIndex into currentIndex of the destination', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      (
        componentInstance as unknown as {
          onDropped: (
            e: CdkDragDrop<unknown>,
            side: 'source' | 'target',
          ) => void;
        }
      ).onDropped(dropEvent(1, 0, false), 'target');

      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'rust',
        'py',
      ]);
      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'go',
        'ts',
      ]);
    });
  });

  describe('disabled items', () => {
    it('a disabled row cannot be checked', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE_WITH_DISABLED, target: [] },
        },
      );

      within(container).getByRole('option', { name: 'Go' }).click();
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('option', { name: 'Go' })
          .getAttribute('aria-selected'),
      ).toBe('false');
      expect(componentInstance.target()).toEqual([]);
    });

    it('a disabled row has cdkDragDisabled reflecting it', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE_WITH_DISABLED, target: [] },
      });

      const row = within(container).getByRole('option', { name: 'Go' });
      expect(row.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('disabled root', () => {
    it('makes checkbox toggling, move buttons, and reordering all inert', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET, disabled: true },
        },
      );

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move all to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
      ]);
      expect(componentInstance.target().map((o) => o.value)).toEqual(['ts']);
    });
  });

  describe('readOnly root', () => {
    it('makes checkbox toggling, move buttons, and reordering all inert, but keeps panels focusable', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET, readOnly: true },
        },
      );

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move all to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.source().map((o) => o.value)).toEqual([
        'rust',
        'go',
        'py',
      ]);
      expect(componentInstance.target().map((o) => o.value)).toEqual(['ts']);

      const sourceList = panelListEl(container, 'source');
      expect(sourceList.getAttribute('tabindex')).toBe('0');
      expect(sourceList.getAttribute('aria-readonly')).toBe('true');
    });

    it('still allows keyboard navigation to move the active row highlight', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET, readOnly: true },
        },
      );
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown');

      expect(componentInstance['sourceActiveIndex']()).toBe(0);
    });

    it('disables all move/reorder buttons', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, readOnly: true },
      });

      for (const button of within(container).getAllByRole('button')) {
        expect((button as HTMLButtonElement).disabled).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('moving the last source item empties the panel and axe still passes', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: [{ label: 'Rust', value: 'rust' }], target: [] },
        },
      );

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move selected to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.source()).toEqual([]);
      expect(
        container.querySelectorAll('[data-part="sourcePanel"] [role="option"]'),
      ).toHaveLength(0);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('renders an empty target panel without throwing', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: [] },
      });

      expect(
        container.querySelectorAll('[data-part="targetPanel"] [role="option"]'),
      ).toHaveLength(0);
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoPicklistHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoPicklistHarness,
      );

      expect(await harness.getLabels('source')).toEqual([
        'Rust',
        'Go',
        'Python',
      ]);
      await harness.toggleOption('source', 'Rust');
      fixture.detectChanges();
      await harness.clickMoveButton('selected-right');
      fixture.detectChanges();

      expect(await harness.getLabels('target')).toEqual(['TypeScript', 'Rust']);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with both panels populated', async () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a disabled item present', async () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE_WITH_DISABLED, target: TARGET },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with an empty panel', async () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: [], target: [] },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('virtual scroll', () => {
    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: MANY_SOURCE, target: [] },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).toBeNull();
      expect(
        container.querySelectorAll('[data-part="sourcePanel"] [role="option"]'),
      ).toHaveLength(50);
    });

    it('renders both panels through dg-virtual-scroll when enabled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: MANY_SOURCE,
          target: MANY_SOURCE,
          virtualScroll: true,
        },
      });
      await settle(fixture);

      expect(container.querySelectorAll('dg-virtual-scroll')).toHaveLength(2);
    });

    it('makes sourceDropListDisabled()/targetDropListDisabled() true while virtualized, independent of disabled/readOnly', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, virtualScroll: true },
      });

      const instance = componentInstance as unknown as {
        sourceDropListDisabled: () => boolean;
        targetDropListDisabled: () => boolean;
      };
      expect(instance.sourceDropListDisabled()).toBe(true);
      expect(instance.targetDropListDisabled()).toBe(true);
    });

    it('still allows checkbox selection while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: MANY_SOURCE, target: [], virtualScroll: true },
        },
      );
      await settle(fixture);

      const option = within(container)
        .getAllByRole('option')
        .find((el) => el.textContent?.trim() === 'Option 1') as HTMLElement;
      option.click();
      fixture.detectChanges();

      expect(
        componentInstance.source().find((o) => o.value === 'option-1'),
      ).toBeTruthy();
      expect(option.getAttribute('aria-selected')).toBe('true');
    });

    it('keyboard navigation still moves the active row while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: MANY_SOURCE, target: [], virtualScroll: true },
        },
      );
      await settle(fixture);
      const sourceList = panelListEl(container, 'source');

      dispatchKey(sourceList, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(sourceList, 'Enter');
      fixture.detectChanges();

      expect(componentInstance.source()[0]?.value).toBe('option-1');
      expect(
        within(container)
          .getAllByRole('option')[0]
          ?.getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('keyboard reorder buttons still work while virtualized', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: [], target: SOURCE, virtualScroll: true },
        },
      );
      const targetList = panelListEl(container, 'target');
      dispatchKey(targetList, 'ArrowDown'); // active = Rust (index 0)
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: 'Move down in Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'go',
        'rust',
        'py',
      ]);
    });

    it('move-selected/move-all buttons still transfer items across panels while virtualized', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET, virtualScroll: true },
        },
      );
      await settle(fixture);

      within(container).getByRole('option', { name: 'Rust' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move selected to Selected' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.target().map((o) => o.value)).toEqual([
        'ts',
        'rust',
      ]);
    });

    // Regression test for the same bug fixed in Listbox/Select: CDK's
    // `scrollToIndex` is an unconditional absolute scroll, so wiring it to
    // every activeIndex change — including `(mouseenter)` hover — would
    // jump the list on every mouseover. `scrollActiveIntoView()` runs only
    // from the keyboard-nav/reorder paths.
    it('does not scroll the viewport on hover, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: MANY_SOURCE, target: [], virtualScroll: true },
      });
      await settle(fixture);
      const viewport = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      ).componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      const secondOption = within(container).getAllByRole(
        'option',
      )[1] as HTMLElement;
      secondOption.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      dispatchKey(panelListEl(container, 'source'), 'ArrowDown');
      fixture.detectChanges();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('has no axe violations when virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: MANY_SOURCE,
          target: MANY_SOURCE,
          virtualScroll: true,
        },
      });
      await settle(fixture);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('filter', () => {
    it('renders no filter box by default', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      expect(container.querySelector('input[type="search"]')).toBeNull();
    });

    it('narrows the source panel independently of the target panel', () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });

      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'go' },
      });
      fixture.detectChanges();

      expect(panelRowTexts(container, 'source')).toEqual(['Go']);
      expect(panelRowTexts(container, 'target')).toEqual(['TypeScript']);
    });

    it('narrows the target panel independently of the source panel', () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: SOURCE, filterable: true },
      });

      fireEvent.input(panelFilterInput(container, 'target'), {
        target: { value: 'py' },
      });
      fixture.detectChanges();

      expect(panelRowTexts(container, 'target')).toEqual(['Python']);
      expect(panelRowTexts(container, 'source')).toEqual([
        'Rust',
        'Go',
        'Python',
      ]);
    });

    it('restores all rows once the query is cleared', () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });
      const input = panelFilterInput(container, 'source');

      fireEvent.input(input, { target: { value: 'go' } });
      fixture.detectChanges();
      fireEvent.input(input, { target: { value: '' } });
      fixture.detectChanges();

      expect(panelRowTexts(container, 'source')).toEqual([
        'Rust',
        'Go',
        'Python',
      ]);
    });

    it('shows the no-results message only when that panel non-empty but the filter matched nothing', () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });

      expect(within(container).queryByRole('status')).toBeNull();

      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'zzz' },
      });
      fixture.detectChanges();

      expect(within(container).getByRole('status').textContent).toBe(
        'No matching options',
      );
    });

    it('does not show the no-results message for a genuinely empty panel', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: [], target: TARGET, filterable: true },
      });

      expect(within(container).queryByRole('status')).toBeNull();
    });

    it("keyboard navigation only visits that panel's filtered/visible rows", () => {
      // "e" matches One/Three but not Two — ArrowDown from One should land
      // on Three directly, not the hidden Two.
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, {
        inputs: { source: FILTER_SOURCE, target: [], filterable: true },
      });
      const input = panelFilterInput(container, 'source');
      fireEvent.input(input, { target: { value: 'e' } });
      fixture.detectChanges();
      // Typing already activates the first match (One) — confirm that,
      // then one ArrowDown should land on Three, skipping the hidden Two.
      expect(componentInstance['sourceActiveValue']()).toBe('1');

      dispatchKey(panelListEl(container, 'source'), 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance['sourceActiveValue']()).toBe('3');
    });

    it('makes sourceDropListDisabled()/targetDropListDisabled() true only for the panel whose own filter is active', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoPicklist<string>
      >(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });
      const instance = componentInstance as unknown as {
        sourceDropListDisabled: () => boolean;
        targetDropListDisabled: () => boolean;
      };

      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'go' },
      });
      fixture.detectChanges();
      expect(instance.sourceDropListDisabled()).toBe(true);
      expect(instance.targetDropListDisabled()).toBe(false);

      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: '' },
      });
      fixture.detectChanges();
      expect(instance.sourceDropListDisabled()).toBe(false);
    });

    it('reorder buttons still move the active item in the full array while that panel is filtered', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: [], target: FILTER_SOURCE, filterable: true },
        },
      );
      const input = panelFilterInput(container, 'target');
      fireEvent.input(input, { target: { value: 'e' } }); // One, Three visible; Two hidden
      fixture.detectChanges();

      within(container).getByRole('option', { name: 'One' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move down in Selected' })
        .click();
      fixture.detectChanges();

      // One moved past the hidden Two in the full array...
      expect(componentInstance.target().map((o) => o.value)).toEqual([
        '2',
        '1',
        '3',
      ]);
      // ...but the filtered/visible order is unaffected, since filtering
      // preserves relative order among visible rows.
      expect(panelRowTexts(container, 'target')).toEqual(['One', 'Three']);
    });

    it("Escape in a panel's filter box clears that panel's query", () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });
      const input = panelFilterInput(container, 'source');
      fireEvent.input(input, { target: { value: 'go' } });
      fixture.detectChanges();

      dispatchKey(input, 'Escape');
      fixture.detectChanges();

      expect(panelRowTexts(container, 'source')).toEqual([
        'Rust',
        'Go',
        'Python',
      ]);
    });

    it('has no axe violations with both filter boxes rendered', async () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a no-results message rendered', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, filterable: true },
      });
      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'zzz' },
      });
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    describe('via DynamoPicklistHarness', () => {
      it('drives the filter box and reports no-results/drag-disabled state per panel', async () => {
        const { fixture } = renderDynamoComponent(DynamoPicklist, {
          inputs: { source: SOURCE, target: TARGET, filterable: true },
        });
        const harness = await TestbedHarnessEnvironment.harnessForFixture(
          fixture,
          DynamoPicklistHarness,
        );

        expect(await harness.hasNoResults('source')).toBe(false);
        await harness.setFilterText('source', 'go');
        fixture.detectChanges();

        expect(await harness.getFilterText('source')).toBe('go');
        expect(await harness.getLabels('source')).toEqual(['Go']);
        expect(await harness.isDragDisabled('source')).toBe(true);
        expect(await harness.isDragDisabled('target')).toBe(false);

        await harness.setFilterText('source', 'zzz');
        fixture.detectChanges();
        expect(await harness.hasNoResults('source')).toBe(true);
      });

      it('throws from setFilterText when filterable is off', async () => {
        const { fixture } = renderDynamoComponent(DynamoPicklist, {
          inputs: { source: SOURCE, target: TARGET },
        });
        const harness = await TestbedHarnessEnvironment.harnessForFixture(
          fixture,
          DynamoPicklistHarness,
        );

        await expect(harness.setFilterText('source', 'go')).rejects.toThrow();
      });
    });
  });

  describe('filter + virtual scroll combined', () => {
    it('filters the virtualized set (filteredSource feeds [items], not the raw source())', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: {
            source: MANY_SOURCE,
            target: [],
            filterable: true,
            virtualScroll: true,
          },
        },
      );
      await settle(fixture);

      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'Option 1' },
      });
      await settle(fixture);

      // Matches "Option 1", "Option 10".."Option 19" — 11 total. Asserted
      // against the logical filtered set, not DOM-rendered row count — the
      // virtualized viewport only ever mounts however many rows fit, not
      // every match.
      expect(componentInstance['filteredSource']()).toHaveLength(11);
      expect(
        container.querySelector('[data-part="sourcePanel"] dg-virtual-scroll'),
      ).not.toBeNull();
    });

    it('drag stays disabled while filtering, even with virtualScroll off', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: SOURCE, target: TARGET, filterable: true },
        },
      );
      fireEvent.input(panelFilterInput(container, 'source'), {
        target: { value: 'go' },
      });
      fixture.detectChanges();

      expect(
        (
          componentInstance as unknown as {
            sourceDropListDisabled: () => boolean;
          }
        ).sourceDropListDisabled(),
      ).toBe(true);
    });

    it('drag stays disabled while virtualized, even with filterable off', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: SOURCE,
          target: TARGET,
          virtualScroll: true,
        },
      });

      expect(
        (
          componentInstance as unknown as {
            sourceDropListDisabled: () => boolean;
          }
        ).sourceDropListDisabled(),
      ).toBe(true);
    });
  });
});

describe('DynamoPicklist — baseline parity (Phase 0)', () => {
  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/sourcePanel/targetPanel/listbox/option/checkbox/moveButtons/reorderButtons/filter/no-results', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: SOURCE,
          target: TARGET,
          filterable: true,
          pt: {
            root: { class: 'pt-root' },
            sourcePanel: { class: 'pt-source-panel' },
            targetPanel: { class: 'pt-target-panel' },
            listbox: { class: 'pt-listbox' },
            option: { class: 'pt-option' },
            checkbox: { class: 'pt-checkbox' },
            moveButtons: { class: 'pt-move-buttons' },
            reorderButtons: { class: 'pt-reorder-buttons' },
            filter: { class: 'pt-filter' },
            'no-results': { class: 'pt-no-results' },
          },
        },
      });

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(container.querySelector('.pt-source-panel')).not.toBeNull();
      expect(container.querySelector('.pt-target-panel')).not.toBeNull();
      expect(
        container.querySelectorAll('[role="listbox"].pt-listbox'),
      ).toHaveLength(2);
      expect(
        container.querySelectorAll('[role="option"].pt-option'),
      ).toHaveLength(4);
      expect(container.querySelectorAll('.pt-checkbox')).toHaveLength(4);
      expect(container.querySelector('.pt-move-buttons')).not.toBeNull();
      expect(container.querySelectorAll('.pt-reorder-buttons')).toHaveLength(2);
      expect(
        container.querySelector('input[type="search"].pt-filter'),
      ).not.toBeNull();
    });

    it('merges pt class onto the no-results row', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: FILTER_SOURCE,
          target: [],
          filterable: true,
          sourceFilterText: 'zzz-no-match',
          pt: { 'no-results': { class: 'pt-no-results' } },
        },
      });

      expect(container.querySelector('.pt-no-results')).not.toBeNull();
    });
  });

  describe('ariaDescribedby / fluid', () => {
    it('defaults fluid to true', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, fluid: false },
      });
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('forwards ariaDescribedby to both listboxes', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: SOURCE,
          target: TARGET,
          ariaDescribedby: 'help-text',
        },
      });
      const listboxes = container.querySelectorAll('[role="listbox"]');
      expect(listboxes).toHaveLength(2);
      for (const listbox of Array.from(listboxes)) {
        expect(listbox.getAttribute('aria-describedby')).toBe('help-text');
      }
    });
  });

  describe('canMoveUp/canMoveDown — disabled-state bug fix', () => {
    it('returns false when only disabled() is set, not just readOnly()', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, disabled: true },
      });
      // Activate a row first (via keyboard nav) so canMoveDown would
      // otherwise be true — the bug was that `disabled()` alone never
      // blocked these methods.
      const list = panelListEl(container, 'source');
      list.focus();
      dispatchKey(list, 'ArrowDown');
      fixture.detectChanges();

      const upButton = within(container).getByRole('button', {
        name: 'Move up in Available',
      });
      const downButton = within(container).getByRole('button', {
        name: 'Move down in Available',
      });
      expect(upButton.hasAttribute('disabled')).toBe(true);
      expect(downButton.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('aria-multiselectable', () => {
    it('is always "true" on both listboxes, unconditionally', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const listboxes = container.querySelectorAll('[role="listbox"]');
      expect(listboxes).toHaveLength(2);
      for (const listbox of Array.from(listboxes)) {
        expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
      }
    });
  });

  describe('aria-disabled on the root listboxes', () => {
    it('is "true" on both listboxes when disabled()', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, disabled: true },
      });
      const listboxes = container.querySelectorAll('[role="listbox"]');
      for (const listbox of Array.from(listboxes)) {
        expect(listbox.getAttribute('aria-disabled')).toBe('true');
      }
    });

    it('is absent when not disabled()', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });
      const listboxes = container.querySelectorAll('[role="listbox"]');
      for (const listbox of Array.from(listboxes)) {
        expect(listbox.hasAttribute('aria-disabled')).toBe(false);
      }
    });
  });

  describe('filter boxes genuinely disable', () => {
    it('does not update sourceFilterText/targetFilterText while disabled()', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: {
            source: FILTER_SOURCE,
            target: TARGET,
            filterable: true,
            disabled: true,
          },
        },
      );

      const input = panelFilterInput(container, 'source');
      expect(input.disabled).toBe(true);
      fireEvent.input(input, { target: { value: 'One' } });

      expect(componentInstance.sourceFilterText()).toBe('');
    });

    it('does not update sourceFilterText/targetFilterText while readOnly()', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: {
            source: FILTER_SOURCE,
            target: TARGET,
            filterable: true,
            readOnly: true,
          },
        },
      );

      const input = panelFilterInput(container, 'source');
      expect(input.disabled).toBe(true);
      fireEvent.input(input, { target: { value: 'One' } });

      expect(componentInstance.sourceFilterText()).toBe('');
    });

    it('still updates sourceFilterText when neither disabled() nor readOnly()', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPicklist,
        {
          inputs: { source: FILTER_SOURCE, target: TARGET, filterable: true },
        },
      );

      const input = panelFilterInput(container, 'source');
      expect(input.disabled).toBe(false);
      fireEvent.input(input, { target: { value: 'One' } });

      expect(componentInstance.sourceFilterText()).toBe('One');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: {
          source: SOURCE,
          target: TARGET,
          ariaDescribedby: 'help-text',
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});

@Component({
  selector: 'dg-picklist-templates-host',
  standalone: true,
  imports: [DynamoPicklist],
  template: `
    <dg-picklist
      [(source)]="source"
      [(target)]="target"
      sourceLabel="Available"
      targetLabel="Selected"
      [virtualScroll]="virtualScroll()"
    >
      <ng-template #optionTemplate let-option>
        <span data-testid="custom-option">{{ option.label }} (custom)</span>
      </ng-template>
    </dg-picklist>
  `,
})
class PicklistOptionTemplateHostComponent {
  readonly source = model(SOURCE);
  readonly target = model(TARGET);
  readonly virtualScroll = model(false);
}

describe('DynamoPicklist — custom item templates (Phase 1)', () => {
  describe('optionTemplate', () => {
    it('renders the default plain-label text when unset, in both panels', () => {
      const { container } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET },
      });

      expect(panelRowTexts(container, 'source')).toEqual([
        'Rust',
        'Go',
        'Python',
      ]);
      expect(panelRowTexts(container, 'target')).toEqual(['TypeScript']);
      expect(
        container.querySelector('[data-testid="custom-option"]'),
      ).toBeNull();
    });

    it('renders projected content instead of the plain label when set, in both panels', () => {
      const { container } = renderDynamoComponent(
        PicklistOptionTemplateHostComponent,
      );

      const sourceCustom = container.querySelectorAll(
        '[data-part="sourcePanel"] [data-testid="custom-option"]',
      );
      const targetCustom = container.querySelectorAll(
        '[data-part="targetPanel"] [data-testid="custom-option"]',
      );
      expect(sourceCustom).toHaveLength(3);
      expect(targetCustom).toHaveLength(1);
      expect(sourceCustom[0]?.textContent).toContain('Rust (custom)');
      expect(targetCustom[0]?.textContent).toContain('TypeScript (custom)');
    });

    it('passes the full option as $implicit', () => {
      const { container } = renderDynamoComponent(
        PicklistOptionTemplateHostComponent,
      );

      const sourceCustomTexts = Array.from(
        container.querySelectorAll(
          '[data-part="sourcePanel"] [data-testid="custom-option"]',
        ),
      ).map((el) => el.textContent?.trim());
      expect(sourceCustomTexts).toEqual([
        'Rust (custom)',
        'Go (custom)',
        'Python (custom)',
      ]);
    });

    it('forwards through the virtualized render path, in both panels', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        PicklistOptionTemplateHostComponent,
      );
      componentInstance.source.set(MANY_SOURCE);
      componentInstance.virtualScroll.set(true);
      fixture.detectChanges();
      await settle(fixture);

      expect(
        container.querySelector('[data-part="sourcePanel"] dg-virtual-scroll'),
      ).not.toBeNull();
      expect(
        container.querySelector('[data-part="targetPanel"] dg-virtual-scroll'),
      ).not.toBeNull();

      const sourceCustom = container.querySelector(
        '[data-part="sourcePanel"] [data-testid="custom-option"]',
      );
      expect(sourceCustom).not.toBeNull();
      expect(sourceCustom?.textContent).toContain('(custom)');

      const targetCustom = container.querySelector(
        '[data-part="targetPanel"] [data-testid="custom-option"]',
      );
      expect(targetCustom).not.toBeNull();
      expect(targetCustom?.textContent).toContain('TypeScript (custom)');
    });
  });
});
