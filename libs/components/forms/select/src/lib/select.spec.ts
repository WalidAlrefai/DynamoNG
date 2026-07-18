import { Component, model } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createMockSelectOptions, expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoSelect } from './select';
import { DynamoSelectHarness } from './select.harness';
import type { DynamoSelectOption } from './select.types';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

@Component({
  selector: 'dg-select-test-host',
  standalone: true,
  imports: [DynamoSelect],
  template: `<dg-select [options]="options" [(value)]="value" aria-label="Choose an option" />`,
})
class SelectTestHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'dg-select-reactive-form-host',
  standalone: true,
  imports: [DynamoSelect, ReactiveFormsModule],
  template: `<dg-select [options]="options" [formControl]="control" aria-label="Choose an option" />`,
})
class SelectReactiveFormHostComponent {
  readonly options = THREE_OPTIONS;
  readonly control = new FormControl<string | null>(null);
}

describe('DynamoSelect', () => {
  describe('creation', () => {
    it('renders a combobox trigger button', () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render the listbox until opened', () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      expect(container.querySelector('[role="listbox"]')).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder text when no value is selected', () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe('Select an option');
    });

    it('defaults to closed and not disabled', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      expect(componentInstance['isOpen']()).toBe(false);
      expect(componentInstance.disabled()).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects a custom placeholder', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, placeholder: 'Pick one' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe('Pick one');
    });

    it('shows the selected option label when value is set', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-2' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe('Option 2');
    });

    it('reflects the disabled input onto the trigger', () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });

      expect((within(container).getByRole('combobox') as HTMLButtonElement).disabled).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('propagates a selection to a two-way-bound host signal', async () => {
      const { container, componentInstance } = renderDynamoComponent(SelectTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox'));
      await userEvent.click(within(container).getByRole('option', { name: 'Option 2' }));

      expect(componentInstance.value()).toBe('option-2');
    });
  });

  describe('user interactions', () => {
    it('opens the listbox when the trigger is clicked', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    });

    it('closes the listbox when an option is clicked, updating the trigger label', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await userEvent.click(within(container).getByRole('option', { name: 'Option 1' }));

      expect(container.querySelector('[role="listbox"]')).toBeNull();
      expect(componentInstance.value()).toBe('option-1');
    });

    it('opens and moves the active option with ArrowDown', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    it('moves the active option backwards with ArrowUp, wrapping to the last option', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      // First ArrowDown opens the list and sets activeIndex to 0.
      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      // From index 0, ArrowUp wraps backwards to the last option.
      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('jumps to the first and last options with Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{End}');
      expect(componentInstance['activeIndex']()).toBe(2);

      await userEvent.keyboard('{Home}');
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('opens (without moving) on Enter when closed', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{Enter}');

      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    });

    it('selects the active option with Enter', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(componentInstance.value()).toBe('option-2');
      expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('closes without selecting when Escape is pressed', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{Escape}');

      expect(container.querySelector('[role="listbox"]')).toBeNull();
      expect(componentInstance.value()).toBeNull();
    });

    it('supports interaction through the DynamoSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoSelectHarness);

      await harness.selectOptionByText('Option 3');

      expect(await harness.getTriggerText()).toBe('Option 3');
    });
  });

  describe('conditional rendering', () => {
    it('renders one <li role="option"> per supplied option', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(within(container).getAllByRole('option')).toHaveLength(3);
    });
  });

  describe('template behavior', () => {
    it('reflects isOpen via aria-expanded on the trigger', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const trigger = within(container).getByRole('combobox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      await userEvent.click(trigger);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('sets aria-selected="true" only on the selected option', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, value: 'option-2' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      const options = within(container).getAllByRole('option');

      expect(options[0]?.getAttribute('aria-selected')).toBe('false');
      expect(options[1]?.getAttribute('aria-selected')).toBe('true');
      expect(options[2]?.getAttribute('aria-selected')).toBe('false');
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
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Choose an option' },
      });

      await userEvent.click(within(container).getByRole('combobox'));

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('sets aria-activedescendant to the active option id while open', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const trigger = within(container).getByRole('combobox');
      trigger.focus?.();

      await userEvent.click(trigger);

      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
      expect(container.querySelector(`#${activeDescendant}`)).not.toBeNull();
    });
  });

  describe('state changes', () => {
    it('cannot be opened by click when disabled', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('updates the trigger label after a value change from outside (writeValue)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });

      fixture.componentInstance.writeValue('option-3');
      fixture.detectChanges();

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe('Option 3');
    });

    it('propagates a selection to a bound reactive FormControl (registerOnChange)', async () => {
      const { container, componentInstance } = renderDynamoComponent(SelectReactiveFormHostComponent);

      await userEvent.click(within(container).getByRole('combobox'));
      await userEvent.click(within(container).getByRole('option', { name: 'Option 2' }));

      expect(componentInstance.control.value).toBe('option-2');
    });

    it('marks the bound FormControl as touched when the listbox closes (registerOnTouched)', async () => {
      const { container, componentInstance } = renderDynamoComponent(SelectReactiveFormHostComponent);
      expect(componentInstance.control.touched).toBe(false);

      await userEvent.click(within(container).getByRole('combobox'));
      await userEvent.keyboard('{Escape}');

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables the trigger when the bound FormControl is disabled (setDisabledState)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(SelectReactiveFormHostComponent);

      componentInstance.control.disable();
      fixture.detectChanges();

      expect((within(container).getByRole('combobox') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders an empty listbox without throwing when options is an empty array', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: [] } });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(container.querySelector('[role="listbox"]')).not.toBeNull();
      expect(container.querySelectorAll('[role="option"]')).toHaveLength(0);
    });

    it('skips disabled options when navigating with ArrowDown', async () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first' },
        { label: 'Second (disabled)', value: 'second', disabled: true },
        { label: 'Third', value: 'third' },
      ];
      const { container, componentInstance } = renderDynamoComponent(DynamoSelect, {
        inputs: { options: optionsWithDisabled },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('handles rapid open/close toggling without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoSelect, { inputs: { options: THREE_OPTIONS } });
      const trigger = within(container).getByRole('combobox');

      for (let i = 0; i < 5; i++) {
        await userEvent.click(trigger);
        await userEvent.click(trigger);
      }

      expect(true).toBe(true);
    });
  });
});
