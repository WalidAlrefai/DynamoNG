import type { ComponentFixture } from '@angular/core/testing';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { within } from '@testing-library/dom';
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

    it('makes dropListDisabled() true while virtualized, independent of disabled/readOnly', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPicklist, {
        inputs: { source: SOURCE, target: TARGET, virtualScroll: true },
      });

      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(true);
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
});
