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
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoAutocomplete } from './autocomplete';
import { DynamoAutocompleteHarness } from './autocomplete.harness';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

// jsdom has no real `Element.scrollTo` implementation at all. When
// `virtualScroll` is enabled, DynamoAutocomplete's explicit keyboard-nav
// `scrollActiveIntoView()` calls reach the virtual-scroll viewport's
// `scrollToIndex()` (via CDK's viewport, which calls `scrollTo`
// internally). A minimal stub (jsdom-only; this is a real,
// universally-supported browser API) lets these tests exercise the real
// keyboard-nav-while-virtualized behavior instead of throwing.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

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
      await expect(harness.selectOptionByText('Nonexistent')).rejects.toThrow();
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

  describe('readOnly', () => {
    it('blocks typing, does not open the panel, and reflects aria-readonly', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: {
          options: THREE_OPTIONS,
          value: 'Option 1',
          readOnly: true,
          ariaLabel: 'Fruit',
        },
      });
      const field = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(field, '2');
      await settle(fixture);

      expect(field.value).toBe('Option 1');
      expect(getPanel()).toBeNull();
      expect(field.getAttribute('aria-readonly')).toBe('true');
    });

    it('does not open the panel on ArrowDown', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, readOnly: true, ariaLabel: 'Fruit' },
      });
      const field = within(container).getByRole('combobox');
      field.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('stays focusable and not disabled, unlike the disabled state', () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, readOnly: true, ariaLabel: 'Fruit' },
      });
      const field = within(container).getByRole('combobox') as HTMLInputElement;

      expect(field.disabled).toBe(false);
      expect(field.tabIndex).toBe(0);
    });

    it('ignores a click on a suggestion if the panel was already open when readOnly turned on', async () => {
      const { container, fixture, componentInstance, setInputs } =
        renderDynamoComponent(DynamoAutocomplete, {
          inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit' },
        });
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'Option');
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      setInputs({ readOnly: true });
      await userEvent.click(getOptions()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value()).toBe('Option');
    });
  });

  describe('loading', () => {
    it('renders a spinner over the field only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoAutocomplete,
        {
          inputs: {
            options: THREE_OPTIONS,
            loading: false,
            ariaLabel: 'Fruit',
          },
        },
      );
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('disables the field, sets aria-busy, and blocks typing while loading', async () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: {
          options: THREE_OPTIONS,
          value: 'Option 1',
          loading: true,
          ariaLabel: 'Fruit',
        },
      });
      const field = within(container).getByRole('combobox') as HTMLInputElement;

      expect(field.disabled).toBe(true);
      expect(field.getAttribute('aria-busy')).toBe('true');

      await userEvent.type(field, '2');

      expect(field.value).toBe('Option 1');
    });

    it('does not open the panel on ArrowDown while loading', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, loading: true, ariaLabel: 'Fruit' },
      });
      const field = within(container).getByRole('combobox');
      field.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('re-enables the field when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoAutocomplete,
        {
          inputs: { options: THREE_OPTIONS, loading: true, ariaLabel: 'Fruit' },
        },
      );
      const field = within(container).getByRole('combobox') as HTMLInputElement;
      expect(field.disabled).toBe(true);

      setInputs({ loading: false });

      expect(field.disabled).toBe(false);
    });
  });

  describe('lazy mode / search', () => {
    // Fake timers + userEvent's async internals don't mix (same reasoning
    // as DynamoSelect's typeahead-timeout spec) — a raw `input` dispatch
    // exercises the same `onInput()` handler DynamoAutocomplete's template
    // binds to, without going through userEvent's own scheduling.
    function typeInto(field: HTMLElement, value: string): void {
      (field as HTMLInputElement).value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    it('never emits search when lazy is false, even after typing', () => {
      vi.useFakeTimers();
      try {
        const onSearch = vi.fn();
        @Component({
          selector: 'dg-autocomplete-nonlazy-host',
          standalone: true,
          imports: [DynamoAutocomplete],
          template: `<dg-autocomplete
            [options]="options"
            (searchQuery)="onSearch($event)"
            ariaLabel="Fruit"
          />`,
        })
        class NonLazyHostComponent {
          readonly options = THREE_OPTIONS;
          onSearch = onSearch;
        }

        const { container } = renderDynamoComponent(NonLazyHostComponent);
        const field = within(container).getByRole('combobox');

        typeInto(field, 'Option');
        vi.advanceTimersByTime(1000);

        expect(onSearch).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('emits search with the typed text after debounceTime elapses', () => {
      vi.useFakeTimers();
      try {
        const onSearch = vi.fn();
        @Component({
          selector: 'dg-autocomplete-lazy-host',
          standalone: true,
          imports: [DynamoAutocomplete],
          template: `<dg-autocomplete
            [options]="options"
            [lazy]="true"
            [debounceTime]="300"
            (searchQuery)="onSearch($event)"
            ariaLabel="Fruit"
          />`,
        })
        class LazyHostComponent {
          readonly options: DynamoSelectOption<string>[] = [];
          onSearch = onSearch;
        }

        const { container } = renderDynamoComponent(LazyHostComponent);
        const field = within(container).getByRole('combobox');

        typeInto(field, 'app');
        expect(onSearch).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('app');
      } finally {
        vi.useRealTimers();
      }
    });

    it('resets the debounce timer on every keystroke, emitting once for the final value', () => {
      vi.useFakeTimers();
      try {
        const onSearch = vi.fn();
        @Component({
          selector: 'dg-autocomplete-lazy-debounce-host',
          standalone: true,
          imports: [DynamoAutocomplete],
          template: `<dg-autocomplete
            [options]="options"
            [lazy]="true"
            [debounceTime]="300"
            (searchQuery)="onSearch($event)"
            ariaLabel="Fruit"
          />`,
        })
        class LazyDebounceHostComponent {
          readonly options: DynamoSelectOption<string>[] = [];
          onSearch = onSearch;
        }

        const { container } = renderDynamoComponent(LazyDebounceHostComponent);
        const field = within(container).getByRole('combobox');

        typeInto(field, 'a');
        vi.advanceTimersByTime(200);
        typeInto(field, 'ab');
        vi.advanceTimersByTime(200);
        expect(onSearch).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith('ab');
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not emit search below minLength', () => {
      vi.useFakeTimers();
      try {
        const onSearch = vi.fn();
        @Component({
          selector: 'dg-autocomplete-lazy-minlength-host',
          standalone: true,
          imports: [DynamoAutocomplete],
          template: `<dg-autocomplete
            [options]="options"
            [lazy]="true"
            [minLength]="3"
            [debounceTime]="10"
            (searchQuery)="onSearch($event)"
            ariaLabel="Fruit"
          />`,
        })
        class LazyMinLengthHostComponent {
          readonly options: DynamoSelectOption<string>[] = [];
          onSearch = onSearch;
        }

        const { container } = renderDynamoComponent(LazyMinLengthHostComponent);
        const field = within(container).getByRole('combobox');

        typeInto(field, 'ab');
        vi.advanceTimersByTime(50);
        expect(onSearch).not.toHaveBeenCalled();

        typeInto(field, 'abc');
        vi.advanceTimersByTime(50);
        expect(onSearch).toHaveBeenCalledWith('abc');
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders options() as-is without local filtering when lazy is true', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, lazy: true },
      });
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'zzz-does-not-match-any-label');
      await settle(fixture);

      expect(getOptions()).toHaveLength(THREE_OPTIONS.length);
    });

    it('shows the no-results message when lazy options() is empty, even though options-overall is empty too', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: [], lazy: true, noResultsMessage: 'Nothing' },
      });
      const field = within(container).getByRole('combobox');
      await userEvent.type(field, 'a');
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Nothing');
    });
  });

  describe('grouped options', () => {
    it('renders a heading row per group', async () => {
      const groupedOptions: DynamoSelectOption<string>[] = [
        createMockSelectOption({
          label: 'Apple',
          value: 'apple',
          group: 'Fruit',
        }),
        createMockSelectOption({
          label: 'Carrot',
          value: 'carrot',
          group: 'Vegetable',
        }),
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
      const field = within(container).getByRole('combobox') as HTMLInputElement;

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

      const field = within(container).getByRole('combobox') as HTMLInputElement;
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
      const field = within(container).getByRole('combobox') as HTMLInputElement;
      field.getBoundingClientRect = () =>
        ({
          width: 321,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => '',
        }) as DOMRect;

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
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: [] },
      });
      const field = within(container).getByRole('combobox');

      await expect(userEvent.type(field, 'anything')).resolves.not.toThrow();
      await settle(fixture);
    });
  });

  describe('virtual scroll', () => {
    const MANY_OPTIONS: DynamoSelectOption<string>[] =
      createMockSelectOptions(50);

    it('renders the suggestion list through dg-virtual-scroll when enabled (ungrouped case)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeTruthy();
    });

    it('still renders real option rows and supports selecting one by click', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoAutocomplete,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);
      await userEvent.click(getOptions()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.value()).toBe('Option 1');
      expect(getPanel()).toBeNull(); // selecting closes the panel, same as the non-virtualized path
    });

    it('preserves mousedown-preventDefault on virtualized rows so clicking a suggestion does not blur the field', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      const mousedownPrevented = !getOptions()[0]?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      );
      expect(mousedownPrevented).toBe(true);
    });

    it('keyboard navigation still moves activeIndex while virtualized', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        DynamoAutocomplete,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );
      const field = within(container).getByRole('combobox') as HTMLElement;
      await userEvent.type(field, 'Option');
      await settle(fixture);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    // Regression test for the same bug fixed in DynamoSelect: CDK's
    // `scrollToIndex` is an unconditional absolute scroll, so calling it on
    // every `activeIndex` change — including `(mouseenter)` hover, which
    // only ever targets an already-visible row — visibly jumps the panel.
    // `scrollActiveIntoView()` is called only from keyboard-driven sites.
    it('does not scroll the viewport when hovering an option, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });
      const field = within(container).getByRole('combobox') as HTMLElement;
      await userEvent.type(field, 'Option');
      await settle(fixture);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewport =
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      (getOptions()[1] as HTMLElement).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      field.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('falls back to the full, non-virtualized render for grouped options even when virtualScroll is true', async () => {
      const groupedOptions: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Engineering' },
        { label: 'Bea', value: 'bea', group: 'Design' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: groupedOptions, virtualScroll: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(
        getPanel()?.querySelectorAll('li[role="presentation"]').length,
      ).toBeGreaterThan(0);
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: MANY_OPTIONS },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(getOptions()).toHaveLength(50);
    });

    it('has no axe violations when open and virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: {
          options: MANY_OPTIONS,
          ariaLabel: 'Option',
          virtualScroll: true,
        },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });
});

describe('DynamoAutocomplete — baseline parity (Phase 0)', () => {
  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/field/panel/listbox/group/option', async () => {
      const grouped: DynamoSelectOption<string>[] = [
        { label: 'Apple', value: 'apple', group: 'Fruits' },
        { label: 'Banana', value: 'banana', group: 'Fruits' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: {
          options: grouped,
          ariaLabel: 'Fruit',
          pt: {
            root: { class: 'pt-root' },
            field: { class: 'pt-field' },
            panel: { class: 'pt-panel' },
            listbox: { class: 'pt-listbox' },
            group: { class: 'pt-group' },
            option: { class: 'pt-option' },
          },
        },
      });

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(within(container).getByRole('combobox').className).toContain(
        'pt-field',
      );

      await userEvent.type(within(container).getByRole('combobox'), 'a');
      await settle(fixture);

      expect(getOverlayContainer().querySelector('.pt-panel')).not.toBeNull();
      expect(getPanel()?.className).toContain('pt-listbox');
      expect(getPanel()?.querySelector('.pt-group')).not.toBeNull();
      expect(getPanel()?.querySelector('.pt-option')).not.toBeNull();
    });
  });

  describe('ariaDescribedby / fluid', () => {
    it('defaults fluid to true', () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit' },
      });
      expect(within(container).getByRole('combobox').className).toContain(
        'w-full',
      );
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', fluid: false },
      });
      expect(within(container).getByRole('combobox').className).not.toContain(
        'w-full',
      );
    });

    it('forwards ariaDescribedby to the field', () => {
      const { container } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: {
          options: THREE_OPTIONS,
          ariaLabel: 'Fruit',
          ariaDescribedby: 'help-text',
        },
      });
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBe('help-text');
    });
  });

  describe('active-index revalidation effect', () => {
    it('does not promote the deliberate -1 (nothing highlighted) state while typing', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit' },
      });
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, 'Option');
      await settle(fixture);

      expect(field.getAttribute('aria-activedescendant')).toBeNull();
    });

    it('recovers activeIndex if options() shrinks below it while the panel is open', async () => {
      const { container, fixture, setInputs, componentInstance } =
        renderDynamoComponent(DynamoAutocomplete, {
          inputs: {
            options: createMockSelectOptions(5),
            ariaLabel: 'Fruit',
          },
        });

      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      await settle(fixture);
      expect(componentInstance['activeIndex']()).toBe(2);

      setInputs({ options: createMockSelectOptions(1) });
      await settle(fixture);

      expect(componentInstance['activeIndex']()).toBe(0);
    });
  });

  describe('minLength gates typing-driven open/close in local (non-lazy) mode', () => {
    it('does not open the panel below minLength', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', minLength: 2 },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'O');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('opens the panel once minLength is reached', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', minLength: 2 },
      });

      await userEvent.type(within(container).getByRole('combobox'), 'Op');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('closes the panel when backspacing back below minLength', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', minLength: 2 },
      });
      const field = within(container).getByRole('combobox');

      await userEvent.type(field, 'Op');
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.type(field, '{Backspace}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it("ArrowDown's keyboard-driven open stays un-gated by minLength", async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', minLength: 2 },
      });
      const field = within(container).getByRole('combobox');
      field.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });
});

describe('DynamoAutocomplete — clearable (Phase 1)', () => {
  it('renders no clear button by default, or when the field is empty', () => {
    const { container } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', clearable: true },
    });
    expect(
      within(container).queryByRole('button', { name: 'Clear' }),
    ).toBeNull();
  });

  it('renders a clear button once text is typed', async () => {
    const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', clearable: true },
    });
    await userEvent.type(within(container).getByRole('combobox'), 'a');
    await settle(fixture);

    expect(
      within(container).getByRole('button', { name: 'Clear' }),
    ).toBeTruthy();
  });

  it('clicking it clears the value, refocuses the field, and leaves the panel closed', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      DynamoAutocomplete,
      {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', clearable: true },
      },
    );
    const field = within(container).getByRole('combobox');
    await userEvent.type(field, 'a');
    await settle(fixture);
    await userEvent.click(
      within(container).getByRole('button', { name: 'Clear' }),
    );
    await settle(fixture);

    expect(componentInstance.value()).toBe('');
    expect(document.activeElement).toBe(field);
    expect(getPanel()).toBeNull();
  });

  it('is hidden while loading, even with text present', () => {
    // The field is itself disabled while loading (`isDisabled()`), so the
    // value is set directly as an input rather than typed.
    const { container } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: {
        options: THREE_OPTIONS,
        ariaLabel: 'Fruit',
        clearable: true,
        loading: true,
        value: 'a',
      },
    });

    expect(
      within(container).queryByRole('button', { name: 'Clear' }),
    ).toBeNull();
  });

  it('respects a custom clearAriaLabel', async () => {
    const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: {
        options: THREE_OPTIONS,
        ariaLabel: 'Fruit',
        clearable: true,
        clearAriaLabel: 'Clear fruit',
      },
    });
    await userEvent.type(within(container).getByRole('combobox'), 'a');
    await settle(fixture);

    expect(
      within(container).getByRole('button', { name: 'Clear fruit' }),
    ).toBeTruthy();
  });

  it('merges pt class onto the clear button', async () => {
    const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: {
        options: THREE_OPTIONS,
        ariaLabel: 'Fruit',
        clearable: true,
        pt: { clear: { class: 'pt-clear' } },
      },
    });
    await userEvent.type(within(container).getByRole('combobox'), 'a');
    await settle(fixture);

    expect(container.querySelector('button.pt-clear')).not.toBeNull();
  });

  it('has no axe violations with the clear button visible', async () => {
    const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
      inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit', clearable: true },
    });
    await userEvent.type(within(container).getByRole('combobox'), 'a');
    await settle(fixture);

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});

@Component({
  selector: 'dg-autocomplete-templates-host',
  standalone: true,
  imports: [DynamoAutocomplete],
  template: `
    <dg-autocomplete
      [options]="options"
      [(value)]="value"
      ariaLabel="Fruit"
      [virtualScroll]="virtualScroll()"
    >
      <ng-template #optionTemplate let-option>
        <span data-testid="custom-option">{{ option.label }} (custom)</span>
      </ng-template>
    </dg-autocomplete>
  `,
})
class AutocompleteOptionTemplateHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model('');
  readonly virtualScroll = model(false);
}

@Component({
  selector: 'dg-autocomplete-group-template-host',
  standalone: true,
  imports: [DynamoAutocomplete],
  template: `
    <dg-autocomplete [options]="options" [(value)]="value" ariaLabel="Fruit">
      <ng-template #groupTemplate let-label>
        <strong data-testid="custom-group">{{ label }} —</strong>
      </ng-template>
    </dg-autocomplete>
  `,
})
class AutocompleteGroupTemplateHostComponent {
  readonly options: DynamoSelectOption<string>[] = [
    { label: 'Apple', value: 'apple', group: 'Fruits' },
  ];
  readonly value = model('');
}

describe('DynamoAutocomplete — custom item templates (Phase 2)', () => {
  describe('optionTemplate', () => {
    it('renders the default plain-label text when unset', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Fruit' },
      });
      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      expect(getOptions()[0]?.textContent?.trim()).toBe('Option 1');
      expect(
        getPanel()?.querySelector('[data-testid="custom-option"]'),
      ).toBeNull();
    });

    it('renders projected content instead of the plain label when set', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteOptionTemplateHostComponent,
      );
      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      const custom = getPanel()?.querySelector('[data-testid="custom-option"]');
      expect(custom).not.toBeNull();
      expect(custom?.textContent).toContain('Option 1 (custom)');
    });

    it('passes the full option as $implicit', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteOptionTemplateHostComponent,
      );
      await userEvent.type(within(container).getByRole('combobox'), 'Option 2');
      await settle(fixture);

      const custom = getPanel()?.querySelector('[data-testid="custom-option"]');
      expect(custom?.textContent).toContain('Option 2 (custom)');
    });

    it('forwards through the virtualized render path', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AutocompleteOptionTemplateHostComponent,
      );
      componentInstance.virtualScroll.set(true);
      fixture.detectChanges();
      await userEvent.type(within(container).getByRole('combobox'), 'Option');
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).not.toBeNull();
      const custom = getPanel()?.querySelector('[data-testid="custom-option"]');
      expect(custom).not.toBeNull();
      expect(custom?.textContent).toContain('(custom)');
    });
  });

  describe('groupTemplate', () => {
    it('renders the default plain-label text when unset', async () => {
      const options: DynamoSelectOption<string>[] = [
        { label: 'Apple', value: 'apple', group: 'Fruits' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoAutocomplete, {
        inputs: { options, ariaLabel: 'Fruit' },
      });
      await userEvent.type(within(container).getByRole('combobox'), 'a');
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Fruits');
      expect(
        getPanel()?.querySelector('[data-testid="custom-group"]'),
      ).toBeNull();
    });

    it('renders projected content instead of the plain label when set', async () => {
      const { container, fixture } = renderDynamoComponent(
        AutocompleteGroupTemplateHostComponent,
      );
      await userEvent.type(within(container).getByRole('combobox'), 'a');
      await settle(fixture);

      const custom = getPanel()?.querySelector('[data-testid="custom-group"]');
      expect(custom).not.toBeNull();
      expect(custom?.textContent).toContain('Fruits —');
    });
  });
});
