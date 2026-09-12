import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoListbox } from './listbox';
import { DynamoListboxHarness } from './listbox.harness';

// jsdom has no real `Element.scrollTo`. When `virtualScroll` is enabled,
// DynamoListbox's explicit keyboard-nav `scrollActiveIntoView()` calls
// reach the virtual-scroll viewport's `scrollToIndex()` (CDK's viewport
// calls `scrollTo` internally). A minimal stub lets these tests exercise
// the real keyboard-nav-while-virtualized behavior instead of throwing.
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

const OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Card', value: 'card' },
];

const OPTIONS_WITH_DISABLED = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid', disabled: true },
  { label: 'Card', value: 'card' },
];

const GROUPED_OPTIONS = [
  { label: 'Apple', value: 'apple', group: 'Fruits' },
  { label: 'Banana', value: 'banana', group: 'Fruits' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
  { label: 'Grain', value: 'grain' },
];

function dispatchKey(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('DynamoListbox', () => {
  describe('creation', () => {
    it('renders a listbox with one option per entry in single-select mode', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, ariaLabel: 'View' },
      });

      expect(within(container).getByRole('listbox', { name: 'View' })).toBeTruthy();
      expect(within(container).getAllByRole('option')).toHaveLength(3);
      expect(container.querySelector('[role="listbox"]')?.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('sets aria-multiselectable="true" in multi-select mode', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true, ariaLabel: 'Tags' },
      });

      expect(
        container.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable'),
      ).toBe('true');
    });
  });

  describe('single-select behavior', () => {
    it('clicking an option sets value to that option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS } },
      );

      within(container).getByRole('option', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('grid');
    });

    it('clicking the already-selected option is a no-op re-set, never nulls the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'list' } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('reflects the selected option via aria-selected, and only that option', () => {
      const { fixture, container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, value: 'grid' },
      });
      fixture.detectChanges();

      expect(
        within(container).getByRole('option', { name: 'Grid' }).getAttribute('aria-selected'),
      ).toBe('true');
      expect(
        within(container).getByRole('option', { name: 'List' }).getAttribute('aria-selected'),
      ).toBe('false');
    });
  });

  describe('multi-select behavior', () => {
    it('clicking toggles membership in the value array', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();
      within(container).getByRole('option', { name: 'Card' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list', 'card']);
    });

    it('clicking an already-selected option removes it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true, value: ['list', 'grid'] } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });

    it('reflects each option independently via aria-selected, and renders a check icon only for selected options', () => {
      const { fixture, container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true, value: ['list', 'card'] },
      });
      fixture.detectChanges();

      const list = within(container).getByRole('option', { name: 'List' });
      const grid = within(container).getByRole('option', { name: 'Grid' });
      expect(list.getAttribute('aria-selected')).toBe('true');
      expect(grid.getAttribute('aria-selected')).toBe('false');
      expect(list.querySelector('svg')).not.toBeNull();
      expect(grid.querySelector('svg')).toBeNull();
    });
  });

  describe('grouping', () => {
    it('renders heading rows between groups in first-seen order, with ungrouped options unheaded', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: GROUPED_OPTIONS },
      });

      const rows = Array.from(
        container.querySelectorAll('[role="option"], [role="presentation"]'),
      );
      const summary = rows.map((row) => [row.getAttribute('role'), row.textContent?.trim()]);

      expect(summary).toEqual([
        ['presentation', 'Fruits'],
        ['option', 'Apple'],
        ['option', 'Banana'],
        ['presentation', 'Vegetables'],
        ['option', 'Carrot'],
        ['option', 'Grain'],
      ]);
    });
  });

  describe('keyboard navigation — single-select mode', () => {
    it('ArrowDown moves the active option and selects it, wrapping at the end', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'card' } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('ArrowDown skips disabled options', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS_WITH_DISABLED, value: 'list' } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('card');
    });

    it('Home/End jump to the first/last enabled option and select it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'grid' } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'End');
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('card');

      dispatchKey(root, 'Home');
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('list');
    });

    it('Enter selects the active option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(root, 'Enter');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('grid');
    });
  });

  describe('keyboard navigation — multi-select mode', () => {
    it('ArrowDown moves the active option without changing the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true, value: ['list'] } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list']);
    });

    it('Space toggles the active option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown'); // active index seeds to 0 (List); Arrow moves to Grid
      fixture.detectChanges();
      dispatchKey(root, ' ');
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });
  });

  describe('disabled options', () => {
    it('an individually-disabled option is not clickable', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS_WITH_DISABLED } },
      );

      within(container).getByRole('option', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });

    it('a fully-disabled options list leaves activeIndex unset (no aria-activedescendant)', () => {
      const allDisabled = OPTIONS.map((o) => ({ ...o, disabled: true }));
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: allDisabled },
      });

      expect(
        container.querySelector('[role="listbox"]')?.hasAttribute('aria-activedescendant'),
      ).toBe(false);
    });
  });

  describe('disabled root', () => {
    it('makes the whole listbox inert', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, disabled: true } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      expect(root.getAttribute('aria-disabled')).toBe('true');
      expect(root.getAttribute('tabindex')).toBe('-1');

      within(container).getByRole('option', { name: 'Grid' }).click();
      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoListboxHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoListboxHarness,
      );

      await harness.clickOption('Grid');
      fixture.detectChanges();

      expect(await harness.getSelectedLabels()).toEqual(['Grid']);
    });

    it('reports a disabled option through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS_WITH_DISABLED },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoListboxHarness,
      );

      expect(await harness.isOptionDisabled('Grid')).toBe(true);
      expect(await harness.isOptionDisabled('List')).toBe(false);
    });
  });

  describe('itemSelect', () => {
    it('emits the full option object on click', () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: OPTIONS } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getByRole('option', { name: 'Grid' }).click();

      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('emits on Enter (isolated from arrow-key auto-selection via multi-select mode)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: OPTIONS, multiple: true } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      // ArrowDown only moves the active highlight in multi-select mode — no
      // emission until Enter actually activates it.
      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();
      expect(emitted).toHaveLength(0);

      dispatchKey(root, 'Enter');
      fixture.detectChanges();

      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('emits on arrow-key navigation in single-select mode (selection follows focus)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: OPTIONS, value: 'list' } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();

      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('does not emit on arrow-key navigation in multi-select mode, only on Space/Enter', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: OPTIONS, multiple: true } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();
      expect(emitted).toHaveLength(0);

      dispatchKey(root, ' ');
      fixture.detectChanges();
      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('does not emit for a disabled option', () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: OPTIONS_WITH_DISABLED } });
      const emitted: (typeof OPTIONS_WITH_DISABLED)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getByRole('option', { name: 'Grid' }).click();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('typeahead', () => {
    const FRUITS = [
      { label: 'Apple', value: 'apple' },
      { label: 'Apricot', value: 'apricot' },
      { label: 'Banana', value: 'banana' },
    ];

    it('jumps the active index to the first matching option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: FRUITS, multiple: true } });
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'b');
      fixture.detectChanges();

      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('cycles through options sharing the same starting letter on repeated presses', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: FRUITS, multiple: true } });
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(1);

      dispatchKey(root, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { fixture, container, componentInstance } =
          renderDynamoComponent<DynamoListbox<string>>(DynamoListbox, {
            inputs: { options: FRUITS, multiple: true },
          });
        const root = container.querySelector(
          '[role="listbox"]',
        ) as HTMLElement;

        dispatchKey(root, 'a');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(1);

        vi.advanceTimersByTime(600);

        dispatchKey(root, 'b');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled options', () => {
      const optionsWithDisabled = [
        { label: 'Apple', value: 'apple' },
        { label: 'Apricot', value: 'apricot', disabled: true },
      ];
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, {
        inputs: { options: optionsWithDisabled, multiple: true },
      });
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(root, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('also selects on match in single-select mode, since selection follows focus there', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoListbox<string>
      >(DynamoListbox, { inputs: { options: FRUITS } });
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'b');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('banana');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in single-select mode with a selection', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, ariaLabel: 'View', value: 'list' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in multi-select mode with mixed selected/disabled options', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: {
          options: OPTIONS_WITH_DISABLED,
          multiple: true,
          ariaLabel: 'Tags',
          value: ['list'],
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with grouped options', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: GROUPED_OPTIONS, ariaLabel: 'Produce' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('virtual scroll', () => {
    const MANY_OPTIONS = Array.from({ length: 50 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option-${i + 1}`,
    }));

    it('renders the option list through dg-virtual-scroll when enabled (ungrouped case)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true, ariaLabel: 'Many' },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).toBeTruthy();
    });

    it('still renders real option rows and selects one by click', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        {
          inputs: {
            options: MANY_OPTIONS,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );
      await settle(fixture);

      const option = within(container)
        .getAllByRole('option')
        .find((el) => el.textContent?.trim() === 'Option 1') as HTMLElement;
      await userEvent.click(option);

      expect(componentInstance.value()).toBe('option-1');
    });

    it('keyboard navigation still moves the active option while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        {
          inputs: {
            options: MANY_OPTIONS,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );
      await settle(fixture);
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();
      // activeIndex is seeded to the first option (option-1), so one
      // ArrowDown lands on option-2; single-select active-follows-focus
      // moves the value with it.
      expect(componentInstance.value()).toBe('option-2');
    });

    // Regression test for the same bug fixed in DynamoSelect: CDK's
    // `scrollToIndex` is an unconditional absolute scroll, so wiring it to
    // every `activeIndex` change — including `(mouseenter)` hover — would
    // jump the list on every mouseover. `scrollActiveIntoView()` runs only
    // via `setActiveIndex()` (the keyboard path).
    it('does not scroll the viewport when hovering an option, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: {
          options: MANY_OPTIONS,
          virtualScroll: true,
          multiple: true,
          ariaLabel: 'Many',
        },
      });
      await settle(fixture);
      const viewport = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      ).componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      const secondOption = within(container).getAllByRole('option')[1] as HTMLElement;
      secondOption.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      dispatchKey(
        container.querySelector('[role="listbox"]') as HTMLElement,
        'ArrowDown',
      );
      fixture.detectChanges();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('falls back to the full, non-virtualized render for grouped options even when virtualScroll is true', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: {
          options: GROUPED_OPTIONS,
          virtualScroll: true,
          ariaLabel: 'Produce',
        },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).toBeNull();
      expect(
        container.querySelectorAll('li[role="presentation"]').length,
      ).toBeGreaterThan(0);
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: MANY_OPTIONS, ariaLabel: 'Many' },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).toBeNull();
      expect(within(container).getAllByRole('option')).toHaveLength(50);
    });

    it('has no axe violations when virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true, ariaLabel: 'Many' },
      });
      await settle(fixture);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
