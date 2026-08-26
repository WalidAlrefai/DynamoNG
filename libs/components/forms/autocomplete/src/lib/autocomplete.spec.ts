import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createMockSelectOption,
  createMockSelectOptions,
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSelectOption } from '@dynamong/select';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoAutocomplete } from './autocomplete';
import { DynamoAutocompleteHarness } from './autocomplete.harness';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

// The CDK overlay portals `role="listbox"` content into a
// `.cdk-overlay-container` appended near document.body — outside the
// fixture's own `container` element — same reasoning as DynamoSelect's spec.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="listbox"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getOptions(): HTMLElement[] {
  return Array.from(getPanel()?.querySelectorAll('[role="option"]') ?? []);
}

// The isOpen()-driven overlay attach/detach effect runs via Angular's
// zoneless effect scheduler, not synchronously with the signal write that
// triggered it — flushing a real setTimeout(0) plus detectChanges() is
// needed before asserting on the result, same technique as DynamoSelect's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-autocomplete-test-host',
  standalone: true,
  imports: [DynamoAutocomplete],
  template: `<dg-autocomplete
    [options]="options"
    [(value)]="value"
    (optionSelect)="lastSelected.set($event)"
    ariaLabel="Fruit"
  />`,
})
class AutocompleteTestHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model('');
  readonly lastSelected = model<DynamoSelectOption<string> | null>(null);
}

@Component({
  selector: 'dg-autocomplete-reactive-form-host',
  standalone: true,
  imports: [DynamoAutocomplete, ReactiveFormsModule],
  template: `<dg-autocomplete
    [options]="options"
    [formControl]="control"
    ariaLabel="Fruit"
  />`,
})
class AutocompleteReactiveFormHostComponent {
  readonly options = THREE_OPTIONS;
  readonly control = new FormControl('Option 1');
}

describe('DynamoAutocomplete', () => {
  describe('creation', () => {
    it('renders a combobox field', () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render the listbox until typing starts', () => {
      renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to an empty value and size "md"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(componentInstance.value()).toBe('');
      expect(componentInstance.size()).toBe('md');
    });
  });

  describe('typing and filtering', () => {
    it('opens the panel and filters options as text is typed', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, '2');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getOptions()).toHaveLength(1);
      expect(getOptions()[0]?.textContent).toContain('Option 2');
    });

    it('accepts text that matches no option without throwing or constraining the value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, 'zzz-no-match');
      await settle(fixture);

      expect(componentInstance.value()).toBe('zzz-no-match');
      expect(getOptions()).toHaveLength(0);
    });

    it('does not pre-highlight any option while typing', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, 'Option');
      await settle(fixture);

      expect(field.getAttribute('aria-activedescendant')).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('opens and highlights the first option on ArrowDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      field.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getOptions()[0]?.getAttribute('aria-selected')).toBe('true');
    });

    it('moves the highlight with ArrowDown/ArrowUp and wraps', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{ArrowUp}');
      await settle(fixture);

      const options = getOptions();
      expect(options[options.length - 1]?.getAttribute('aria-selected')).toBe(
        'true',
      );
    });

    it('jumps to the first/last option on Home/End', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{End}');
      const options = getOptions();
      expect(options[options.length - 1]?.getAttribute('aria-selected')).toBe(
        'true',
      );

      await userEvent.keyboard('{Home}');
      expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    });

    it('does nothing on Enter when nothing is highlighted', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option 1');
      await settle(fixture);

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('Option 1');
      expect(componentInstance.lastSelected()).toBeNull();
    });

    it('selects the highlighted option on Enter', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('Option 1');
      expect(componentInstance.lastSelected()?.value).toBe('option-1');
      expect(getPanel()).toBeNull();
    });

    it('closes without altering the typed text on Escape', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option 1');
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(componentInstance.value()).toBe('Option 1');
    });
  });

  describe('selecting a suggestion', () => {
    it('sets the value, emits optionSelect, and closes when a suggestion is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option');
      await settle(fixture);

      await userEvent.click(getOptions()[1] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value()).toBe('Option 2');
      expect(componentInstance.lastSelected()?.value).toBe('option-2');
      expect(getPanel()).toBeNull();
    });

    it('does not blur the field when clicking a suggestion (mousedown is prevented)', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option');
      await settle(fixture);

      const mousedownPrevented = !getOptions()[0]?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );

      expect(mousedownPrevented).toBe(true);
    });

    it('ignores a click on a disabled option', async () => {
      const optionsWithDisabled = [
        ...THREE_OPTIONS,
        createMockSelectOption({
          label: 'Disabled Option',
          value: 'disabled-option',
          disabled: true,
        }),
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoAutocomplete,
        { inputs: { options: optionsWithDisabled } },
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Disabled');
      await settle(fixture);

      await userEvent.click(getOptions()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value()).toBe('Disabled');
      expect(getPanel()).not.toBeNull();
    });

    it('supports interaction through the DynamoAutocompleteHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoAutocompleteHarness,
      );

      await harness.type('Option');
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getOptionTexts()).toEqual([
        'Option 1',
        'Option 2',
        'Option 3',
      ]);
      expect(await harness.getActiveOptionText()).toBeNull();

      const field = within(fixture.nativeElement as HTMLElement).getByRole(
        'combobox',
      );
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
      await settle(fixture);
      expect(await harness.getActiveOptionText()).toBe('Option 1');

      await harness.selectOptionByText('Option 3');
      expect(componentInstance.value()).toBe('Option 3');

      await harness.type('Option');
      await expect(
        harness.selectOptionByText('Nonexistent'),
      ).rejects.toThrow();
    });
  });

  describe('blur', () => {
    it('closes the panel on blur', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option');
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      field.blur();
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });
  });

  describe('grouped options', () => {
    it('renders a heading row per group', async () => {
      const groupedOptions: DynamoSelectOption<string>[] = [
        createMockSelectOption({ label: 'Apple', value: 'apple', group: 'Fruit' }),
        createMockSelectOption({ label: 'Carrot', value: 'carrot', group: 'Vegetable' }),
      ];
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: groupedOptions },
      });
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'a');
      await settle(fixture);

      expect(getPanel()?.parentElement?.textContent).toContain('Fruit');
      expect(getPanel()?.parentElement?.textContent).toContain('Vegetable');
    });
  });

  describe('accessibility', () => {
    it('sets role="combobox" with aria-autocomplete="list" and no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');
      expect(field.getAttribute('aria-autocomplete')).toBe('list');

      await userEvent.type(field, 'Option');
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('Angular forms integration', () => {
    it('reflects the initial FormControl value (writeValue)', () => {
      const { container } = renderDynamoComponent(
        AutocompleteReactiveFormHostComponent,
      );
      const field = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;

      expect(field.value).toBe('Option 1');
    });

    it('propagates typed input back to the FormControl (registerOnChange)', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteReactiveFormHostComponent,
      );
      const field = within(container).getByRole('combobox');

      await userEvent.clear(field);
      await userEvent.type(field, 'Option 2');
      await settle(fixture);

      expect(fixture.componentInstance.control.value).toBe('Option 2');
    });

    it('disables the field when the FormControl is disabled (setDisabledState)', () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteReactiveFormHostComponent,
      );
      fixture.componentInstance.control.disable();
      fixture.detectChanges();

      const field = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;
      expect(field.disabled).toBe(true);
    });
  });

  describe('overlay width', () => {
    // jsdom has no layout engine (getBoundingClientRect returns all zeros)
    // and doesn't implement ResizeObserver at all — the initial width is
    // still verifiable (mocked below), but live resize-tracking is only
    // verifiable in a real browser, same category of limitation as
    // Carousel's/Slider's pointer-drag tests.
    it('sets the overlay pane width to the field width when opened', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole(
        'combobox',
      ) as HTMLInputElement;
      field.getBoundingClientRect = () =>
        ({ width: 321, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => '' }) as DOMRect;

      await userEvent.type(field, 'Option');
      await settle(fixture);

      const pane = document.body.querySelector(
        '.cdk-overlay-pane',
      ) as HTMLElement;
      expect(pane.style.width).toBe('321px');
    });
  });

  describe('edge cases', () => {
    it('shows the no-results message when options exist but none match', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteTestHostComponent,
      );
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, 'zzz-no-match');
      await settle(fixture);

      expect(getPanel()?.parentElement?.textContent).toContain(
        'No matching options',
      );
    });

    it('does not throw with an empty options array', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoAutocomplete,
        { inputs: { options: [] } },
      );
      const field = within(container).getByRole('combobox');

      await expect(userEvent.type(field, 'anything')).resolves.not.toThrow();
      await settle(fixture);
    });
  });
});
