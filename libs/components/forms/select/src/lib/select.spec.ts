import { Component, model } from '@angular/core';
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
import { describe, expect, it } from 'vitest';
import { DynamoSelect } from './select';
import { DynamoSelectHarness } from './select.harness';
import type { DynamoSelectOption } from './select.types';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

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
  });
});
