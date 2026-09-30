import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createMockSelectOptions,
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DynamoSelect } from './select';
import { DynamoSelectHarness } from './select.harness';
import type { DynamoSelectOption } from './select.types';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

// jsdom has no real `Element.scrollTo` implementation at all. When
// `virtualScroll` is enabled, DynamoSelect's own constructor effect calls
// the virtual-scroll viewport's `scrollToIndex()` (via CDK's viewport,
// which calls `scrollTo` internally) every time `activeIndex` changes —
// asynchronously, inside the effect, so a per-test try/catch can't reach
// it the way a direct synchronous call could. A minimal stub (jsdom-only;
// this is a real, universally-supported browser API) lets these tests
// exercise the real keyboard-nav-while-virtualized behavior instead of
// crashing the whole run with an unhandled effect exception.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

// The CDK overlay portals `role="listbox"` content into a
// `.cdk-overlay-container` appended near document.body — outside the
// fixture's own `container` element — same reasoning as DynamoMenu's spec.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="listbox"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getOptions(): HTMLElement[] {
  return Array.from(getPanel()?.querySelectorAll('[role="option"]') ?? []);
}

function getOptionByText(text: string): HTMLElement {
  const option = getOptions().find((el) => el.textContent?.trim() === text);
  if (!option) throw new Error(`No option with text "${text}" found`);
  return option;
}

// The open()-driven overlay attach/detach effect runs via Angular's zoneless
// effect scheduler, not synchronously with the signal write that triggered
// it — flushing a real setTimeout(0) plus detectChanges() is needed before
// asserting on the result, same technique as DynamoMenu's/DynamoTooltip's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-select-test-host',
  standalone: true,
  imports: [DynamoSelect],
  template: `<dg-select
    [options]="options"
    [(value)]="value"
    aria-label="Choose an option"
  />`,
})
class SelectTestHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'dg-select-item-select-host',
  standalone: true,
  imports: [DynamoSelect],
  template: `<dg-select
    [options]="options"
    (itemSelect)="selected.set($event)"
    aria-label="Choose an option"
  />`,
})
class SelectItemSelectHostComponent {
  readonly options = THREE_OPTIONS;
  readonly selected = signal<DynamoSelectOption<string> | null>(null);
}

@Component({
  selector: 'dg-select-reactive-form-host',
  standalone: true,
  imports: [DynamoSelect, ReactiveFormsModule],
  template: `<dg-select
    [options]="options"
    [formControl]="control"
    aria-label="Choose an option"
  />`,
})
class SelectReactiveFormHostComponent {
  readonly options = THREE_OPTIONS;
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'dg-select-templates-host',
  standalone: true,
  imports: [DynamoSelect],
  template: `
    <dg-select
      [options]="options"
      [(value)]="value"
      ariaLabel="Choose an option"
    >
      <ng-template #optionTemplate let-option>
        <span data-testid="custom-option">{{ option.label }} (custom)</span>
      </ng-template>
      <ng-template #selectedTemplate let-option>
        <span data-testid="custom-selected">{{
          option ? option.label + ' (chosen)' : 'Nothing yet'
        }}</span>
      </ng-template>
    </dg-select>
  `,
})
class SelectTemplatesHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'dg-select-group-template-host',
  standalone: true,
  imports: [DynamoSelect],
  template: `
    <dg-select [options]="options" ariaLabel="Choose an item">
      <ng-template #groupTemplate let-label>
        <strong data-testid="custom-group">{{ label }} —</strong>
      </ng-template>
    </dg-select>
  `,
})
class SelectGroupTemplateHostComponent {
  readonly options: DynamoSelectOption<string>[] = [
    { label: 'Ava', value: 'ava', group: 'Team' },
  ];
}

describe('DynamoSelect', () => {
  describe('creation', () => {
    it('renders a combobox trigger button', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render the listbox until opened', () => {
      renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder text when no value is selected', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Select an option',
      );
    });

    it('defaults to closed, not disabled, and not filterable/clearable/invalid', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(componentInstance['isOpen']()).toBe(false);
      expect(componentInstance.disabled()).toBe(false);
      expect(componentInstance.filterable()).toBe(false);
      expect(componentInstance.clearable()).toBe(false);
      expect(componentInstance.invalid()).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects a custom placeholder', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, placeholder: 'Pick one' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Pick one',
      );
    });

    it('shows the selected option label when value is set', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-2' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Option 2',
      );
    });

    it('reflects the disabled input onto the trigger', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });

    it('reflects aria-invalid on the combobox and a danger border on its wrapper when invalid is set', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, invalid: true },
      });
      const trigger = within(container).getByRole('combobox');

      expect(trigger.getAttribute('aria-invalid')).toBe('true');
      // The visible border lives on the wrapper (the combobox button's
      // immediate parent), not the button itself — see select.styles.ts's
      // `selectTriggerStyles` comment on why they're split.
      expect(trigger.parentElement?.className).toContain('border-danger');
    });
  });

  describe('output events', () => {
    it('propagates a selection to a two-way-bound host signal', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));

      expect(componentInstance.value()).toBe('option-2');
    });
  });

  describe('user interactions', () => {
    it('opens the listbox when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('closes the listbox when an option is clicked, updating the trigger label', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 1'));
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(componentInstance.value()).toBe('option-1');
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('clears the value via the clear button without opening the panel', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: 'option-2',
            clearable: true,
          },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toBeNull();
      expect(getPanel()).toBeNull();
    });

    it('does not render a clear button when clearable is false or nothing is selected', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-1', clearable: false },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('opens and moves the active option with ArrowDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    it('moves the active option backwards with ArrowUp, wrapping to the last option', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('jumps to the first and last options with Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{End}');
      expect(componentInstance['activeIndex']()).toBe(2);

      await userEvent.keyboard('{Home}');
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('opens on ArrowUp when closed (same as ArrowDown)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowUp}');

      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('opens (without moving) on Enter when closed', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('selects the active option with Enter', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-2');
      expect(getPanel()).toBeNull();
    });

    it('closes without selecting when Escape is pressed', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(componentInstance.value()).toBeNull();
    });

    it('supports interaction through the DynamoSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectHarness,
      );

      await harness.selectOptionByText('Option 3');
      await settle(fixture);

      expect(await harness.getTriggerText()).toBe('Option 3');
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('conditional rendering', () => {
    it('renders one <li role="option"> per supplied option', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getOptions()).toHaveLength(3);
    });

    it('renders a filter box only when filterable is set', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, filterable: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        document.body.querySelector('input[type="search"]'),
      ).not.toBeNull();
    });
  });

  describe('template behavior', () => {
    it('reflects isOpen via aria-expanded on the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('sets aria-selected="true" only on the selected option', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-2' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const options = getOptions();

      expect(options[0]?.getAttribute('aria-selected')).toBe('false');
      expect(options[1]?.getAttribute('aria-selected')).toBe('true');
      expect(options[2]?.getAttribute('aria-selected')).toBe('false');
    });
  });

  describe('filtering', () => {
    it('narrows the option list as the filter box is typed into, and restores it when cleared', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, filterable: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;

      await userEvent.type(filterInput, '2');
      expect(getOptions().map((el) => el.textContent?.trim())).toEqual([
        'Option 2',
      ]);

      await userEvent.clear(filterInput);
      expect(getOptions()).toHaveLength(3);
    });

    it('shows noResultsMessage when the filter matches nothing, distinct from genuinely-empty options', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          filterable: true,
          noResultsMessage: 'Nothing found',
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      await userEvent.type(filterInput, 'zzz');

      expect(getOptions()).toHaveLength(0);
      expect(getOverlayContainer().textContent).toContain('Nothing found');
    });

    it('shows no message when options itself is genuinely empty', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: [],
          filterable: true,
          noResultsMessage: 'Nothing found',
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getOverlayContainer().textContent).not.toContain('Nothing found');
    });

    it('supports Arrow/Enter keys directly on the filter box', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS, filterable: true },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      filterInput.focus();
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(2);

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance['activeIndex']()).toBe(1);

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-2');
      expect(getPanel()).toBeNull();
    });

    it('resets the filter text when the panel closes', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: THREE_OPTIONS, filterable: true },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      await userEvent.type(filterInput, '2');
      expect(componentInstance.filterText()).toBe('2');

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.filterText()).toBe('');
    });
  });

  describe('readOnly', () => {
    it('still opens the panel and reflects aria-readonly, but blocks selection', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, readOnly: true } },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      expect(trigger.getAttribute('aria-readonly')).toBe('true');
      expect((trigger as HTMLButtonElement).disabled).toBe(false);

      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(getOptionByText('Option 2'));
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
    });

    it('disables the clear button', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: 'option-1',
          clearable: true,
          readOnly: true,
        },
      });

      const clearButton = within(container).getByRole('button', {
        name: 'Clear selection',
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
    });
  });

  describe('grouped options', () => {
    const GROUPED_OPTIONS: DynamoSelectOption<string>[] = [
      { label: 'Ava', value: 'ava', group: 'Engineering' },
      { label: 'Bea', value: 'bea', group: 'Design' },
      { label: 'Cal', value: 'cal', group: 'Engineering' },
    ];

    it('renders a role="presentation" heading per group, in first-seen order', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: GROUPED_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const headings = Array.from(
        getPanel()?.querySelectorAll('[role="presentation"]') ?? [],
      );
      expect(headings.map((h) => h.textContent?.trim())).toEqual([
        'Engineering',
        'Design',
      ]);
    });

    it('skips group headings when navigating with ArrowDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: GROUPED_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

      // 3 options total (Ava, Cal, Bea in render order) — three ArrowDowns
      // from closed lands on the last one, having skipped both headings.
      expect(componentInstance['activeIndex']()).toBe(2);
    });
  });

  describe('virtual scroll', () => {
    const MANY_OPTIONS: DynamoSelectOption<string>[] =
      createMockSelectOptions(50);

    it('renders the option list through dg-virtual-scroll when enabled (ungrouped case)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeTruthy();
    });

    it('still renders real option rows and supports selecting one by click', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 1'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-1');
      expect(getPanel()).toBeNull(); // selecting closes the panel, same as the non-virtualized path
    });

    it('keyboard navigation still moves activeIndex while virtualized', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: MANY_OPTIONS, virtualScroll: true },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    // Regression test for a real bug: CDK's `scrollToIndex` is an
    // unconditional absolute scroll (always jumps so the target index
    // lands at the very top), not a "scroll into view only if needed"
    // call. A prior version of this feature called it from a constructor
    // `effect()` watching `activeIndex()` directly — which fired on every
    // hover too (hover sets `activeIndex` via `(mouseenter)`), visibly
    // jumping the panel on every hover even though the hovered row was
    // already on-screen (the only way to hover it at all). The fix moved
    // the `scrollToIndex` call to only the keyboard-driven call sites.
    it('does not scroll the viewport when hovering an option, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewport =
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      getOptionByText('Option 2').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('falls back to the full, non-virtualized render for grouped options even when virtualScroll is true', async () => {
      const groupedOptions: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Engineering' },
        { label: 'Bea', value: 'bea', group: 'Design' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: groupedOptions, virtualScroll: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(
        getPanel()?.querySelectorAll('[role="presentation"]').length,
      ).toBeGreaterThan(0);
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: MANY_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(getOptions()).toHaveLength(50);
    });
  });

  describe('harness', () => {
    it('opens, closes, and reports state via close()/isDisabled()/getOptionTexts()/getActiveOptionText()', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectHarness,
      );

      expect(await harness.isDisabled()).toBe(false);

      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getOptionTexts()).toEqual([
        'Option 1',
        'Option 2',
        'Option 3',
      ]);
      expect(await harness.getActiveOptionText()).toBe('Option 1');

      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });

    it('filters via the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, filterable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectHarness,
      );

      await harness.filter('2');
      await settle(fixture);

      expect(await harness.getOptionTexts()).toEqual(['Option 2']);
    });

    it('reports isDisabled() true when disabled', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
    });

    it('getActiveOptionText returns null when closed', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectHarness,
      );

      expect(await harness.getActiveOptionText()).toBeNull();
    });
  });

  describe('loading', () => {
    it('renders a spinner in the trigger only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, loading: false },
      });
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('sets aria-busy="true" on the trigger while loading', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });

      expect(
        within(container).getByRole('combobox').getAttribute('aria-busy'),
      ).toBe('true');
    });

    it('disables the trigger while loading even if disabled was not explicitly set', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('does not open the panel while loading', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('re-enables the trigger when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(true);

      setInputs({ loading: false });

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(false);
    });
  });

  describe('itemSelect', () => {
    it('emits the full option object when an option is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SelectItemSelectHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));

      expect(componentInstance.selected()).toEqual(THREE_OPTIONS[1]);
    });

    it('emits the same option on keyboard Enter as on click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        SelectItemSelectHostComponent,
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(componentInstance.selected()).toEqual(THREE_OPTIONS[1]);
    });

    it('does not emit for a disabled option', async () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first' },
        { label: 'Second (disabled)', value: 'second', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: optionsWithDisabled } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Second (disabled)'));

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from programmatic value changes', () => {
      const { componentInstance, setInputs } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      setInputs({ value: 'option-2' });

      expect(emitted).toHaveLength(0);
    });
  });

  describe('typeahead', () => {
    const FRUITS: DynamoSelectOption<string>[] = [
      { label: 'Apple', value: 'apple' },
      { label: 'Apricot', value: 'apricot' },
      { label: 'Banana', value: 'banana' },
    ];

    function dispatchKey(target: HTMLElement, key: string): void {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    it('jumps to and opens the panel on the first matching option while closed', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: FRUITS } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('cycles through options sharing the same starting letter on repeated presses', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: FRUITS } });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(1);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container, fixture, componentInstance } = renderDynamoComponent<
          DynamoSelect<string>
        >(DynamoSelect, {
          inputs: { options: FRUITS },
        });
        const trigger = within(container).getByRole('combobox') as HTMLElement;

        dispatchKey(trigger, 'a');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(0);

        vi.advanceTimersByTime(600);

        dispatchKey(trigger, 'b');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled options, wrapping back to a still-matching enabled one', () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'Apple', value: 'apple' },
        { label: 'Apricot', value: 'apricot', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: optionsWithDisabled } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('does not activate while filterable is true', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoSelect<string>
      >(DynamoSelect, { inputs: { options: FRUITS, filterable: true } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(componentInstance['activeIndex']()).toBe(-1);
      expect(getPanel()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Choose an option' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Choose an option' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations when open and virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: createMockSelectOptions(50),
          ariaLabel: 'Choose an option',
          virtualScroll: true,
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      // The virtualized branch inserts CDK's viewport/content-wrapper divs
      // between `role="listbox"` and its `role="option"` children.
      // `DynamoVirtualScroll` marks every one of those structural elements
      // `role="presentation"` (host + viewport + item wrappers in its
      // template, the CDK-owned content wrapper from its constructor), so
      // the listbox owns its options through an unbroken presentational
      // chain rather than through roleless generics.
      const overlay = getOverlayContainer();
      expect(
        overlay.querySelector('dg-virtual-scroll')?.getAttribute('role'),
      ).toBe('presentation');
      expect(
        overlay
          .querySelector('cdk-virtual-scroll-viewport')
          ?.getAttribute('role'),
      ).toBe('presentation');
      expect(
        overlay
          .querySelector('.cdk-virtual-scroll-content-wrapper')
          ?.getAttribute('role'),
      ).toBe('presentation');

      await expect(expectNoA11yViolations(overlay)).resolves.toBeUndefined();
    });

    it('has no axe violations when open with a filter box and a clear button', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          ariaLabel: 'Choose an option',
          value: 'option-1',
          filterable: true,
          clearable: true,
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('sets aria-activedescendant to the active option id while open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');
      trigger.focus?.();

      await userEvent.click(trigger);
      await settle(fixture);

      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
      expect(
        document.getElementById(activeDescendant as string),
      ).not.toBeNull();
    });
  });

  describe('state changes', () => {
    it('cannot be opened by click when disabled', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(getPanel()).toBeNull();
    });

    it('updates the trigger label after a value change from outside (writeValue)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      fixture.componentInstance.writeValue('option-3');
      fixture.detectChanges();

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Option 3',
      );
    });

    it('propagates a selection to a bound reactive FormControl (registerOnChange)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SelectReactiveFormHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));

      expect(componentInstance.control.value).toBe('option-2');
    });

    it('marks the bound FormControl as touched when the listbox closes (registerOnTouched)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SelectReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables the trigger when the bound FormControl is disabled (setDisabledState)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        SelectReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders an empty listbox without throwing when options is an empty array', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: [] },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getOptions()).toHaveLength(0);
    });

    it('skips disabled options when navigating with ArrowDown', async () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first' },
        { label: 'Second (disabled)', value: 'second', disabled: true },
        { label: 'Third', value: 'third' },
      ];
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: { options: optionsWithDisabled },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('handles rapid open/close toggling without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');

      for (let i = 0; i < 5; i++) {
        await userEvent.click(trigger);
        await userEvent.click(trigger);
      }

      expect(true).toBe(true);
    });

    // Regression test for the activeIndex-recovery effect: opening with
    // every option disabled leaves activeIndex at -1; once one becomes
    // enabled while the panel stays open, the effect should recover it
    // instead of leaving aria-activedescendant pointing at nothing.
    it('recovers activeIndex once a previously all-disabled option list gets an enabled option, while staying open', async () => {
      const allDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first', disabled: true },
        { label: 'Second', value: 'second', disabled: true },
      ];
      const { container, fixture, componentInstance, setInputs } =
        renderDynamoComponent(DynamoSelect, {
          inputs: { options: allDisabled },
        });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      expect(componentInstance['activeIndex']()).toBe(-1);

      setInputs({
        options: [
          { label: 'First', value: 'first', disabled: true },
          { label: 'Second', value: 'second', disabled: false },
        ],
      });
      await settle(fixture);

      expect(componentInstance['activeIndex']()).toBe(1);
      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        getOptionByText('Second').id,
      );
    });

    it('recovers activeIndex when the actively-highlighted option is removed while the panel stays open', async () => {
      const { container, fixture, componentInstance, setInputs } =
        renderDynamoComponent(DynamoSelect, {
          inputs: { options: THREE_OPTIONS },
        });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      trigger.focus();
      // Opening already auto-focuses index 0, so two more ArrowDowns reach index 2.
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(2);

      setInputs({ options: THREE_OPTIONS.slice(0, 2) });
      await settle(fixture);

      expect(componentInstance['activeIndex']()).toBeLessThan(2);
    });
  });

  describe('selectedIndicator', () => {
    it('defaults to none, rendering no indicator icon at all', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-1' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('svg')).toBeNull();
    });

    it('renders a checkmark on the selected option only, in "checkmark" mode', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: 'option-1',
          selectedIndicator: 'checkmark',
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getOptionByText('Option 1').querySelector('svg')).not.toBeNull();
      expect(getOptionByText('Option 2').querySelector('svg')).toBeNull();
    });

    it('renders a checkbox-look indicator on every option, checked only for the selected one, in "checkbox" mode', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: 'option-1',
          selectedIndicator: 'checkbox',
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const selectedOption = getOptionByText('Option 1');
      const unselectedOption = getOptionByText('Option 2');
      expect(
        selectedOption.querySelector('span[aria-hidden="true"]'),
      ).not.toBeNull();
      expect(
        selectedOption.querySelector('span[aria-hidden="true"] svg'),
      ).not.toBeNull();
      expect(
        unselectedOption.querySelector('span[aria-hidden="true"] svg'),
      ).toBeNull();
    });

    it('the checkbox-look indicator is aria-hidden and not independently focusable (no nested interactive control)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          selectedIndicator: 'checkbox',
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const indicator = getOptionByText('Option 1').querySelector(
        'span[aria-hidden="true"]',
      );
      expect(indicator?.querySelector('input, button')).toBeNull();
    });
  });

  describe('editable', () => {
    it('defaults to false, rendering the plain combobox button (no native input)', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLElement).tagName,
      ).toBe('BUTTON');
    });

    it('renders a real typable <input role="combobox"> when editable is true', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, editable: true },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLElement).tagName,
      ).toBe('INPUT');
    });

    it('shows the selected option label as the input value, empty (placeholder-showing) when unset', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, editable: true },
      });
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('');

      setInputs({ value: 'option-2' });
      expect(input.value).toBe('Option 2');
    });

    it('overrides matchOverlayWidthToTrigger to true while editable, false otherwise', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS } },
      );
      expect(componentInstance['matchOverlayWidthToTrigger']()).toBe(false);

      setInputs({ editable: true });
      expect(componentInstance['matchOverlayWidthToTrigger']()).toBe(true);
    });

    it('typing updates the input value live without committing anything yet', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Custom');

      expect(input.value).toBe('Custom');
      expect(componentInstance.value()).toBeNull();
    });

    it('Space types a literal space instead of selecting the highlighted option', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      // userEvent.type() clicks (opens the panel, highlighting the first
      // option) before typing — Space must still type literally rather than
      // selecting that highlighted option.
      await userEvent.type(input, 'a b');

      expect(input.value).toBe('a b');
      expect(componentInstance.value()).toBeNull();
    });

    it('commits a non-matching typed value directly as value on blur', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Something custom');
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toBe('Something custom');
    });

    it('selects the matching option properly (not the raw string) when typed text matches its label exactly, on blur', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Option 2');
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-2');
    });

    it('commits a non-matching typed value directly as value on Enter once the panel is dismissed, without picking the highlighted option', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      // Typing opens the panel (via the click-to-focus) and highlights the
      // first option — Escape dismisses it without touching the typed draft,
      // so the following Enter has nothing highlighted to fall back to and
      // commits the raw text instead.
      await userEvent.type(input, 'Something custom');
      await userEvent.keyboard('{Escape}');
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('Something custom');
      expect(getPanel()).toBeNull();
    });

    it('Enter selects the actively-highlighted option instead of committing the draft, once arrow-keyed onto one', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      // Typing opens the panel (click-to-focus), which already highlights
      // "Option 1"; ArrowDown moves the highlight on to "Option 2" — Enter
      // must select that highlighted option, not commit the typed text.
      await userEvent.type(input, 'Something not matching');
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-2');
    });

    it('clearing an empty-after-editing draft on blur clears the value, same as the clear button', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editable: true,
            value: 'option-1',
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      input.focus();
      await userEvent.clear(input);
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
    });

    it('a pristine (never-typed-in) trigger ignores Enter/blur commit entirely — falls through to normal open/close behavior', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editable: true,
            value: 'option-1',
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      input.focus();
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      // Enter on a pristine trigger (closed, nothing typed) opens the panel
      // like normal — it must NOT have cleared/altered the existing value.
      expect(componentInstance.value()).toBe('option-1');
      expect(getPanel()).not.toBeNull();
    });

    it('clicking the input opens the panel without ever closing it while already open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox');

      await userEvent.click(input);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);

      await userEvent.click(input);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);
    });

    it('clicking the separate icon button toggles the panel open and closed', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const iconButton = within(container).getByRole('button', {
        name: 'Open options',
      });

      await userEvent.click(iconButton);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);

      await userEvent.click(iconButton);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(false);
    });

    it('the clear button clears both the value and any in-progress typed draft', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editable: true,
            clearable: true,
            value: 'option-1',
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      await userEvent.type(input, ' extra');

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toBeNull();
      expect(input.value).toBe('');
    });

    it('a direct mouse click on an option overrides any stale typed draft', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS, editable: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      await userEvent.click(input);
      await settle(fixture);
      await userEvent.type(input, 'stale partial text');

      await userEvent.click(getOptionByText('Option 3'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('option-3');
      expect(input.value).toBe('Option 3');
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: THREE_OPTIONS,
          editable: true,
          ariaLabel: 'Country',
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('custom templates', () => {
    it('renders the option template instead of plain text when provided', async () => {
      const { container, fixture } = renderDynamoComponent(
        SelectTemplatesHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const option = getPanel()?.querySelector('[data-testid="custom-option"]');
      expect(option?.textContent).toContain('Option 1 (custom)');
    });

    it('renders the selected-value template on the trigger instead of selectedLabel', () => {
      const { container } = renderDynamoComponent(SelectTemplatesHostComponent);

      expect(within(container).getByTestId('custom-selected').textContent).toBe(
        'Nothing yet',
      );
    });

    it('passes the selected option into the selected-value template once a value is set', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SelectTemplatesHostComponent,
      );
      componentInstance.value.set('option-2');
      fixture.detectChanges();

      expect(within(container).getByTestId('custom-selected').textContent).toBe(
        'Option 2 (chosen)',
      );
    });

    it('renders the group-heading template instead of plain text when provided', async () => {
      const { container, fixture } = renderDynamoComponent(
        SelectGroupTemplateHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const heading = getPanel()?.querySelector('[data-testid="custom-group"]');
      expect(heading?.textContent).toContain('Team —');
    });

    it('falls back to plain text for options/groups/selected-value when no templates are provided', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-1' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Option 1',
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getOptionByText('Option 2')).toBeTruthy();
    });
  });

  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/trigger/chevron/clear/listbox/group/option/filterInput', async () => {
      const groupedWithFilter: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Team' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: {
          options: groupedWithFilter,
          clearable: true,
          value: 'ava',
          filterable: true,
          pt: {
            root: { class: 'pt-root' },
            trigger: { class: 'pt-trigger' },
            chevron: { class: 'pt-chevron' },
            clear: { class: 'pt-clear' },
            listbox: { class: 'pt-listbox' },
            group: { class: 'pt-group' },
            option: { class: 'pt-option' },
            filterInput: { class: 'pt-filter-input' },
          },
        },
      });

      expect(container.querySelector('div')?.classList).toContain('pt-root');
      expect(within(container).getByRole('combobox').classList).toContain(
        'pt-trigger',
      );
      expect(container.querySelector('div > svg')?.classList).toContain(
        'pt-chevron',
      );
      expect(
        within(container).getByRole('button', { name: 'Clear selection' })
          .classList,
      ).toContain('pt-clear');

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.classList).toContain('pt-listbox');
      expect(
        getPanel()?.querySelector('[role="presentation"]')?.classList,
      ).toContain('pt-group');
      expect(getOptionByText('Ava').classList).toContain('pt-option');
      // The filter box is a sibling of the `<ul role="listbox">`, not a
      // descendant of it — query the whole overlay container instead.
      expect(getOverlayContainer().querySelector('input')?.classList).toContain(
        'pt-filter-input',
      );
    });
  });

  describe('variant / fluid / ariaDescribedby', () => {
    it('defaults variant to outlined and fluid to true', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: THREE_OPTIONS } },
      );
      expect(componentInstance.variant()).toBe('outlined');
      expect(componentInstance.fluid()).toBe(true);
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('applies a different background for the filled variant', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, variant: 'outlined' },
      });
      const outlinedClasses = container.querySelector('div')?.className;

      setInputs({ variant: 'filled' });
      const filledClasses = container.querySelector('div')?.className;

      expect(outlinedClasses).not.toBe(filledClasses);
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, fluid: false },
      });
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('forwards ariaDescribedby to the trigger', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, ariaDescribedby: 'help-text' },
      });
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBe('help-text');
    });
  });

  describe('lazy virtual scroll (scrolledIndexChange)', () => {
    const MANY_OPTIONS: DynamoSelectOption<string>[] =
      createMockSelectOptions(50);

    it('forwards scrolledIndexChange from the underlying dg-virtual-scroll while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSelect,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );
      const emitted: number[] = [];
      componentInstance.scrolledIndexChange.subscribe((i) => emitted.push(i));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewport =
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>;
      viewport.scrolledIndexChange.emit(7);

      // CDK's viewport also emits an initial index (0) on its own attach —
      // assert the forwarded value arrived rather than an exact array, to
      // stay robust to that implementation detail.
      expect(emitted).toContain(7);
    });
  });

  describe('aria-disabled on options while readOnly', () => {
    it('marks every option aria-disabled while readOnly, even ones not individually disabled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, readOnly: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      for (const option of getOptions()) {
        expect(option.getAttribute('aria-disabled')).toBe('true');
      }
    });
  });
});
