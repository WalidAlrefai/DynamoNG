import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoSelectButton } from './select-button';
import { DynamoSelectButtonHarness } from './select-button.harness';

@Component({
  selector: 'dg-select-button-reactive-form-host',
  standalone: true,
  imports: [DynamoSelectButton, ReactiveFormsModule],
  template: `<dg-select-button
    [options]="options"
    [formControl]="control"
    ariaLabel="View"
  />`,
})
class ReactiveFormHostComponent {
  readonly options = [
    { label: 'List', value: 'list' },
    { label: 'Grid', value: 'grid' },
    { label: 'Card', value: 'card' },
  ];
  readonly control = new FormControl<string | null>(null);
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

describe('DynamoSelectButton', () => {
  describe('creation', () => {
    it('renders a radiogroup with one segment per option in single-select mode', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, ariaLabel: 'View' },
      });

      expect(
        within(container).getByRole('radiogroup', { name: 'View' }),
      ).toBeTruthy();
      expect(within(container).getAllByRole('radio')).toHaveLength(3);
    });

    it('renders a group with plain toggle buttons in multi-select mode', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, multiple: true, ariaLabel: 'Tags' },
      });

      expect(
        within(container).getByRole('group', { name: 'Tags' }),
      ).toBeTruthy();
      expect(within(container).getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('single-select behavior', () => {
    it('clicking a segment sets value to that option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS } },
      );

      within(container).getByRole('radio', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('grid');
    });

    it('clicking the already-active segment is a no-op re-set, never nulls the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'list' } },
      );

      within(container).getByRole('radio', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('reflects the active segment via aria-checked, and only that segment', () => {
      const { fixture, container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, value: 'grid' },
      });
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('radio', { name: 'Grid' })
          .getAttribute('aria-checked'),
      ).toBe('true');
      expect(
        within(container)
          .getByRole('radio', { name: 'List' })
          .getAttribute('aria-checked'),
      ).toBe('false');
    });

    it('reserves the same border width on selected and unselected segments, only making the selected one transparent', () => {
      // Regression test: the selected segment uses variant="solid" (no
      // border from DynamoButton itself) while unselected segments use
      // variant="outline" (a real 1px border) — without a same-width
      // transparent border on the selected segment, toggling selection
      // visibly shrinks/grows that segment's rendered box.
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, value: 'grid' },
      });

      const selected = within(container).getByRole('radio', { name: 'Grid' });
      const unselected = within(container).getByRole('radio', { name: 'List' });

      expect(selected.className).toContain('border');
      expect(selected.className).toContain('border-transparent');
      expect(unselected.className).toContain('border');
      expect(unselected.className).not.toContain('border-transparent');
    });
  });

  describe('multi-select behavior', () => {
    it('clicking toggles membership in the value array', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, multiple: true } },
      );

      within(container).getByRole('button', { name: 'List' }).click();
      fixture.detectChanges();
      within(container).getByRole('button', { name: 'Card' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list', 'card']);
    });

    it('clicking an already-selected segment removes it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        {
          inputs: { options: OPTIONS, multiple: true, value: ['list', 'grid'] },
        },
      );

      within(container).getByRole('button', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });

    it('reflects each segment independently via aria-pressed', () => {
      const { fixture, container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, multiple: true, value: ['list', 'card'] },
      });
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'List' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
      expect(
        within(container)
          .getByRole('button', { name: 'Grid' })
          .getAttribute('aria-pressed'),
      ).toBe('false');
      expect(
        within(container)
          .getByRole('button', { name: 'Card' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });
  });

  describe('keyboard navigation — single-select mode', () => {
    it('ArrowRight moves focus and selection to the next segment, wrapping at the end', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'card' } },
      );
      const last = within(container).getByRole('radio', { name: 'Card' });

      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('ArrowLeft/ArrowRight skip disabled segments', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS_WITH_DISABLED, value: 'list' } },
      );
      const first = within(container).getByRole('radio', { name: 'List' });

      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('card');
    });

    it('Home/End jump to the first/last enabled segment', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'grid' } },
      );
      const active = within(container).getByRole('radio', { name: 'Grid' });

      active.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
      );
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('card');

      const last = within(container).getByRole('radio', { name: 'Card' });
      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
      );
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('list');
    });
  });

  describe('keyboard navigation — multi-select mode', () => {
    it('ArrowRight moves focus only, without changing the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, multiple: true, value: ['list'] } },
      );
      const first = within(container).getByRole('button', { name: 'List' });

      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list']);
    });

    it('Enter/Space toggles the focused segment', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, multiple: true } },
      );
      const grid = within(container).getByRole('button', { name: 'Grid' });

      grid.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });
  });

  describe('disabled segments', () => {
    it('an individually-disabled option is not clickable', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS_WITH_DISABLED } },
      );

      (
        within(container).getByRole('radio', {
          name: 'Grid',
        }) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });

    it('disabled reaches the underlying native button', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS_WITH_DISABLED },
      });

      expect(
        (
          within(container).getByRole('radio', {
            name: 'Grid',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('the whole-component disabled input disables every segment', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, disabled: true },
      });

      for (const label of ['List', 'Grid', 'Card']) {
        expect(
          (
            within(container).getByRole('radio', {
              name: label,
            }) as HTMLButtonElement
          ).disabled,
        ).toBe(true);
      }
    });
  });

  describe('readOnly', () => {
    it('blocks click-activation without disabling the native button', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'list', readOnly: true } },
      );
      const grid = within(container).getByRole('radio', {
        name: 'Grid',
      }) as HTMLButtonElement;

      grid.click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
      expect(grid.disabled).toBe(false);
    });

    it('does not emit itemSelect while readOnly', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoSelectButton<string>
      >(DynamoSelectButton, {
        inputs: { options: OPTIONS, readOnly: true },
      });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getByRole('radio', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('blocks Enter/Space activation in multi-select mode while readOnly', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        {
          inputs: {
            options: OPTIONS,
            multiple: true,
            value: ['list'],
            readOnly: true,
          },
        },
      );
      const grid = within(container).getByRole('button', { name: 'Grid' });

      grid.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list']);
    });

    it('still moves the roving tabindex via arrow keys, but blocks the value change that would otherwise follow in single-select mode', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'list', readOnly: true } },
      );
      const first = within(container).getByRole('radio', { name: 'List' });

      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
      expect(
        within(container)
          .getByRole('radio', { name: 'Grid' })
          .getAttribute('tabindex'),
      ).toBe('0');
      expect(first.getAttribute('tabindex')).toBe('-1');
    });

    it('renders aria-readonly on the root in single-select mode', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, readOnly: true },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.getAttribute('aria-readonly'),
      ).toBe('true');
    });

    it('omits aria-readonly in multi-select mode even when readOnly is set', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, multiple: true, readOnly: true },
      });

      expect(
        container
          .querySelector('[role="group"]')
          ?.hasAttribute('aria-readonly'),
      ).toBe(false);
    });

    it('omits aria-readonly by default', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.hasAttribute('aria-readonly'),
      ).toBe(false);
    });
  });

  describe('itemSelect', () => {
    it('emits the full option object on click', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoSelectButton<string>
      >(DynamoSelectButton, { inputs: { options: OPTIONS } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getByRole('radio', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('emits on arrow-key navigation in single-select mode', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoSelectButton<string>
      >(DynamoSelectButton, { inputs: { options: OPTIONS, value: 'card' } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const last = within(container).getByRole('radio', { name: 'Card' });

      last.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();

      expect(emitted).toEqual([OPTIONS[0]]);
    });

    it('does not emit on arrow-key navigation in multi-select mode, only on Enter/Space', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoSelectButton<string>
      >(DynamoSelectButton, { inputs: { options: OPTIONS, multiple: true } });
      const emitted: (typeof OPTIONS)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const first = within(container).getByRole('button', { name: 'List' });

      first.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      fixture.detectChanges();
      expect(emitted).toHaveLength(0);

      const grid = within(container).getByRole('button', { name: 'Grid' });
      grid.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();

      expect(emitted).toEqual([OPTIONS[1]]);
    });

    it('does not emit for a disabled option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent<
        DynamoSelectButton<string>
      >(DynamoSelectButton, { inputs: { options: OPTIONS_WITH_DISABLED } });
      const emitted: (typeof OPTIONS_WITH_DISABLED)[number][] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      (
        within(container).getByRole('radio', {
          name: 'Grid',
        }) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoSelectButtonHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, multiple: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectButtonHarness,
      );

      await harness.clickSegment('Grid');
      fixture.detectChanges();

      expect(await harness.getSelectedLabels()).toEqual(['Grid']);
    });

    it('reports a disabled segment through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS_WITH_DISABLED },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSelectButtonHarness,
      );

      expect(await harness.isSegmentDisabled('Grid')).toBe(true);
      expect(await harness.isSegmentDisabled('List')).toBe(false);
    });
  });

  describe('allowEmpty', () => {
    it('clicking the active segment is a no-op by default', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'list' } },
      );

      within(container).getByRole('radio', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('clicking the active segment deselects it to null when allowEmpty is set', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        { inputs: { options: OPTIONS, value: 'list', allowEmpty: true } },
      );

      within(container).getByRole('radio', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });

    it('does not affect multi-select mode (toggling always works regardless)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoSelectButton,
        {
          inputs: {
            options: OPTIONS,
            multiple: true,
            value: ['list'],
            allowEmpty: false,
          },
        },
      );

      within(container).getByRole('button', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual([]);
    });
  });

  describe('ControlValueAccessor / forms integration', () => {
    it('propagates a click selection to a bound reactive FormControl', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      within(container).getByRole('radio', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.control.value).toBe('grid');
    });

    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('card');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('radio', { name: 'Card' })
          .getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('setDisabledState reflects onto the disabled model', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS },
      });

      componentInstance.setDisabledState(true);

      expect(componentInstance.disabled()).toBe(true);
    });

    it('marks the FormControl as touched on selection', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      within(container).getByRole('radio', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.control.touched).toBe(true);
    });
  });

  describe('pt / ariaDescribedby / fluid', () => {
    it('merges pt class onto root', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, pt: { root: { class: 'pt-root' } } },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.classList.contains('pt-root'),
      ).toBe(true);
    });

    it('merges a non-class pt attribute onto root', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: {
          options: OPTIONS,
          pt: { root: { 'data-testid': 'root-el' } },
        },
      });

      expect(container.querySelector('[data-testid="root-el"]')).not.toBeNull();
    });

    it('merges pt class onto every segment', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, pt: { segment: { class: 'pt-segment' } } },
      });

      for (const radio of within(container).getAllByRole('radio')) {
        expect(radio.classList.contains('pt-segment')).toBe(true);
      }
    });

    it('omits aria-describedby by default, forwards it to the root when set', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, ariaDescribedby: 'hint-id' },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });

    it('stretches the root and shares the width evenly across segments when fluid is set', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, fluid: true },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.classList.contains('w-full'),
      ).toBe(true);
      for (const radio of within(container).getAllByRole('radio')) {
        expect(radio.classList.contains('flex-1')).toBe(true);
      }
    });

    it('does not stretch by default', () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS },
      });

      expect(
        container
          .querySelector('[role="radiogroup"]')
          ?.classList.contains('w-full'),
      ).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in single-select mode', async () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: { options: OPTIONS, ariaLabel: 'View', value: 'list' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in multi-select mode with a disabled segment', async () => {
      const { container } = renderDynamoComponent(DynamoSelectButton, {
        inputs: {
          options: OPTIONS_WITH_DISABLED,
          multiple: true,
          ariaLabel: 'Tags',
          value: ['list'],
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
