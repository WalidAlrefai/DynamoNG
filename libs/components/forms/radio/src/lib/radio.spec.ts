import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoRadio } from './radio';
import { DynamoRadioHarness } from './radio.harness';

@Component({
  selector: 'dg-radio-two-way-host',
  standalone: true,
  imports: [DynamoRadio],
  template: `<dg-radio name="single" [(checked)]="value">Accept</dg-radio>`,
})
class RadioTwoWayHostComponent {
  readonly value = model(false);
}

// Proves the documented split-binding group pattern actually keeps native
// radio-group siblings in sync without a `RadioGroup` container component.
@Component({
  selector: 'dg-radio-group-host',
  standalone: true,
  imports: [DynamoRadio],
  template: `
    <dg-radio
      name="fruit"
      value="apple"
      [checked]="fruit() === 'apple'"
      (checkedChange)="fruit.set('apple')"
      >Apple</dg-radio
    >
    <dg-radio
      name="fruit"
      value="banana"
      [checked]="fruit() === 'banana'"
      (checkedChange)="fruit.set('banana')"
      >Banana</dg-radio
    >
  `,
})
class RadioGroupHostComponent {
  readonly fruit = signal<'apple' | 'banana'>('apple');
}

describe('DynamoRadio', () => {
  describe('creation', () => {
    it('renders without errors with a native radio input', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      expect(within(container).getByRole('radio')).toBeTruthy();
    });

    it('projects the content passed between the component tags as its label', () => {
      const { container } = renderDynamoComponent(RadioTwoWayHostComponent);

      expect(container.textContent).toContain('Accept');
    });

    it('associates the label with the input via a generated id', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      const input = within(container).getByRole('radio') as HTMLInputElement;
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe(input.id);
    });
  });

  describe('default behavior', () => {
    it('defaults to unchecked', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).checked,
      ).toBe(false);
    });

    it('defaults to not disabled', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).disabled,
      ).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects the checked input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', checked: true },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).checked,
      ).toBe(true);
    });

    it('reflects the name input onto the native input element (drives native grouping)', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'fruit' },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).name,
      ).toBe('fruit');
    });

    it('reflects the value input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', value: 'apple' },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).value,
      ).toBe('apple');
    });

    it('reflects the disabled input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', disabled: true },
      });

      expect(
        (within(container).getByRole('radio') as HTMLInputElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoRadio,
        { inputs: { name: 'test' } },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('updates a two-way-bound value when selected', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        RadioTwoWayHostComponent,
      );
      expect(componentInstance.value()).toBe(false);

      await userEvent.click(within(container).getByRole('radio'));

      expect(componentInstance.value()).toBe(true);
    });

    it('emits checkedChange when a grouped sibling is selected', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        RadioGroupHostComponent,
      );
      const radios = within(container).getAllByRole('radio');

      await userEvent.click(radios[1] as HTMLInputElement);

      expect(componentInstance.fruit()).toBe('banana');
    });
  });

  describe('user interactions', () => {
    it('selects when clicked directly', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRadio,
        { inputs: { name: 'test' } },
      );

      await userEvent.click(within(container).getByRole('radio'));

      expect(componentInstance.checked()).toBe(true);
    });

    it('selects when clicked via its associated <label>', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRadio,
        { inputs: { name: 'test' } },
      );
      const label = container.querySelector('label');
      expect(label).not.toBeNull();

      await userEvent.click(label as HTMLLabelElement);

      expect(componentInstance.checked()).toBe(true);
    });

    it('selects via keyboard (Space) when focused', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRadio,
        { inputs: { name: 'test' } },
      );
      const input = within(container).getByRole('radio') as HTMLInputElement;

      input.focus();
      await userEvent.keyboard(' ');

      expect(componentInstance.checked()).toBe(true);
    });

    it('supports interaction through the DynamoRadioHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoRadioHarness,
      );

      expect(await harness.isChecked()).toBe(false);
      await harness.select();
      expect(await harness.isChecked()).toBe(true);
    });

    it('reports disabled/value state through the DynamoRadioHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', value: 'apple', disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoRadioHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
      expect(await harness.getValue()).toBe('apple');
    });
  });

  describe('conditional rendering', () => {
    it('renders no inner dot when unchecked', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      const circle = container.querySelectorAll('span')[0];
      expect(circle?.querySelector('span')).toBeNull();
    });

    it('renders the inner dot only when checked', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', checked: true },
      });

      const circle = container.querySelectorAll('span')[0];
      expect(circle?.querySelector('span')).not.toBeNull();
    });
  });

  describe('template behavior', () => {
    it('applies different circle classes for the checked vs. unchecked state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test', checked: false },
      });
      const uncheckedClasses = container.querySelectorAll('span')[0]?.className;

      setInputs({ checked: true });
      const checkedClasses = container.querySelectorAll('span')[0]?.className;

      expect(uncheckedClasses).not.toBe(checkedClasses);
    });

    it('hides the native input visually while keeping it in the accessibility tree', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      const input = within(container).getByRole('radio');
      expect(input.className).toContain('sr-only');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(RadioTwoWayHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations while checked', async () => {
      const { container } = renderDynamoComponent(RadioTwoWayHostComponent, {
        inputs: { value: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a labelless radio as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });
  });

  describe('state changes', () => {
    it('cannot be selected by click when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRadio,
        {
          inputs: { name: 'test', disabled: true },
        },
      );

      await userEvent.click(within(container).getByRole('radio'));

      expect(componentInstance.checked()).toBe(false);
    });

    it('becomes selectable again once disabled is set back to false', async () => {
      const { container, componentInstance, setInputs } = renderDynamoComponent(
        DynamoRadio,
        {
          inputs: { name: 'test', disabled: true },
        },
      );

      setInputs({ disabled: false });
      await userEvent.click(within(container).getByRole('radio'));

      expect(componentInstance.checked()).toBe(true);
    });

    it('keeps a deselected sibling in sync via the split-binding group pattern', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        RadioGroupHostComponent,
      );
      const radios = within(container).getAllByRole(
        'radio',
      ) as HTMLInputElement[];
      expect(radios[0]?.checked).toBe(true);

      await userEvent.click(radios[1] as HTMLInputElement);

      expect(componentInstance.fruit()).toBe('banana');
      expect(radios[0]?.checked).toBe(false);
      expect(radios[1]?.checked).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders with no projected label content without throwing', () => {
      const { container } = renderDynamoComponent(DynamoRadio, {
        inputs: { name: 'test' },
      });

      expect(within(container).getByRole('radio')).toBeTruthy();
    });

    it('handles rapid repeated clicking on an already-checked radio without losing state', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoRadio,
        {
          inputs: { name: 'test', checked: true },
        },
      );
      const input = within(container).getByRole('radio');

      for (let i = 0; i < 4; i++) {
        await userEvent.click(input);
      }

      expect(componentInstance.checked()).toBe(true);
    });

    it('generates a distinct id for each radio instance sharing the same injector', () => {
      const { container } = renderDynamoComponent(RadioGroupHostComponent);
      const radios = within(container).getAllByRole(
        'radio',
      ) as HTMLInputElement[];
      expect(radios).toHaveLength(2);

      expect(radios[0]?.id).not.toBe(radios[1]?.id);
      expect(radios[0]?.id).toBeTruthy();
      expect(radios[1]?.id).toBeTruthy();
    });
  });
});
