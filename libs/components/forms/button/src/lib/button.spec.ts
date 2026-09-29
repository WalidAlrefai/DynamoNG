import { Component, input } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoButton } from './button';
import { DynamoButtonHarness } from './button.harness';
import type { DynamoButtonSeverity, DynamoButtonSize } from './button.types';

@Component({
  selector: 'dg-button-test-host',
  standalone: true,
  imports: [DynamoButton],
  template: `<dg-button
    [severity]="severity()"
    [size]="size()"
    [disabled]="disabled()"
    [loading]="loading()"
  >
    {{ label() }}
  </dg-button>`,
})
class ButtonTestHostComponent {
  readonly label = input('Save');
  readonly severity = input<DynamoButtonSeverity>('primary');
  readonly size = input<DynamoButtonSize>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
}

describe('DynamoButton', () => {
  describe('creation', () => {
    it('renders without errors and has a native <button> as its interactive element', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(within(container).getByRole('button')).toBeTruthy();
    });

    it('projects the content passed between the component tags', () => {
      const { container } = renderDynamoComponent(ButtonTestHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Save' }),
      ).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to type="button" so it never accidentally submits a form', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(within(container).getByRole('button').getAttribute('type')).toBe(
        'button',
      );
    });

    it('defaults to not disabled and not busy', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      const button = within(container).getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-busy')).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the type input onto the native button', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { type: 'submit' },
      });

      expect(within(container).getByRole('button').getAttribute('type')).toBe(
        'submit',
      );
    });

    it('applies the disabled input to the native button element', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented severity without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoButton);

      for (const severity of [
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'danger',
      ] as const) {
        setInputs({ severity });
        expect(componentInstance.severity()).toBe(severity);
      }
    });

    it('merges a caller-supplied styleClass alongside the built-in classes', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { styleClass: 'my-extra-class' },
      });

      expect(within(container).getByRole('button').className).toContain(
        'my-extra-class',
      );
    });

    it('forwards ariaLabel to the native button as aria-label, for icon-only usage', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { ariaLabel: 'Previous page' },
      });

      expect(
        within(container).getByRole('button', { name: 'Previous page' }),
      ).toBeTruthy();
    });

    it('omits aria-label entirely when ariaLabel is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(
        within(container).getByRole('button').hasAttribute('aria-label'),
      ).toBe(false);
    });

    it('forwards ariaCurrent to the native button as aria-current', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { ariaCurrent: 'page' },
      });

      expect(
        within(container).getByRole('button').getAttribute('aria-current'),
      ).toBe('page');
    });

    it('omits aria-current entirely when ariaCurrent is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(
        within(container).getByRole('button').hasAttribute('aria-current'),
      ).toBe(false);
    });

    it('forwards role to the native button, overriding its implicit role', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { role: 'radio' },
      });

      expect(container.querySelector('button')?.getAttribute('role')).toBe(
        'radio',
      );
    });

    it('omits role entirely when role is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(container.querySelector('button')?.hasAttribute('role')).toBe(
        false,
      );
    });

    it('forwards ariaChecked to the native button as aria-checked', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { ariaChecked: true },
      });

      expect(
        container.querySelector('button')?.getAttribute('aria-checked'),
      ).toBe('true');
    });

    it('omits aria-checked entirely when ariaChecked is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(
        container.querySelector('button')?.hasAttribute('aria-checked'),
      ).toBe(false);
    });

    it('forwards ariaPressed to the native button as aria-pressed', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { ariaPressed: false },
      });

      expect(
        container.querySelector('button')?.getAttribute('aria-pressed'),
      ).toBe('false');
    });

    it('omits aria-pressed entirely when ariaPressed is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(
        container.querySelector('button')?.hasAttribute('aria-pressed'),
      ).toBe(false);
    });

    it('forwards tabIndexOverride to the native button as tabindex', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { tabIndexOverride: -1 },
      });

      expect(container.querySelector('button')?.getAttribute('tabindex')).toBe(
        '-1',
      );
    });

    it('omits tabindex entirely when tabIndexOverride is unset', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(container.querySelector('button')?.hasAttribute('tabindex')).toBe(
        false,
      );
    });

    it('defaults fullWidth to false', () => {
      const { componentInstance } = renderDynamoComponent(DynamoButton);

      expect(componentInstance.fullWidth()).toBe(false);
    });

    it('applies w-full when fullWidth is true', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { fullWidth: true },
      });

      expect(within(container).getByRole('button').className).toContain(
        'w-full',
      );
    });

    it('omits w-full when fullWidth is false', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(within(container).getByRole('button').className).not.toContain(
        'w-full',
      );
    });
  });

  describe('output events', () => {
    // DynamoButton has no custom `output()` — a click on the inner native
    // <button> bubbles through the (non-shadow) DOM to the `dg-button` host
    // element, so a plain native listener on the host catches it directly.
    it('bubbles native click events up to the dg-button host element', async () => {
      const { container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);

      await userEvent.click(within(container).getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('fires once per click, not once per re-render', async () => {
      const { container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);
      const button = within(container).getByRole('button');

      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('does not fire a click on the inner button when the button is disabled', async () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { disabled: true },
      });
      const onClick = vi.fn();
      container.addEventListener('click', onClick);

      await userEvent.click(within(container).getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('user interactions', () => {
    it('is clickable via mouse click', async () => {
      const { container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);

      await userEvent.click(within(container).getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('is focusable and activatable via keyboard (Enter)', async () => {
      const { container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);
      const button = within(container).getByRole('button') as HTMLButtonElement;

      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports interaction through the DynamoButtonHarness', async () => {
      const { fixture, setInputs } = renderDynamoComponent(
        ButtonTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoButtonHarness,
      );

      expect(await harness.getText()).toBe('Save');
      expect(await harness.isDisabled()).toBe(false);
      expect(await harness.isLoading()).toBe(false);

      setInputs({ loading: true });
      expect(await harness.isLoading()).toBe(true);
    });

    it('clicks the button via the DynamoButtonHarness', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoButtonHarness,
      );

      await harness.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('conditional rendering', () => {
    it('only renders the loading spinner when loading is true', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoButton, {
        inputs: { loading: false },
      });
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();

      setInputs({ loading: true });
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('template behavior', () => {
    it('reflects the size input via distinct classes per size', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoButton, {
        inputs: { size: 'sm' },
      });
      const smClasses = container.querySelector('button')?.className ?? '';

      setInputs({ size: 'lg' });
      const lgClasses = container.querySelector('button')?.className ?? '';

      expect(smClasses).not.toBe(lgClasses);
    });

    it('skips all built-in classes when unstyled is true, keeping only styleClass', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { unstyled: true, styleClass: 'custom-only' },
      });

      expect(within(container).getByRole('button').className).toBe(
        'custom-only',
      );
    });
  });

  describe('icon / iconPos', () => {
    @Component({
      selector: 'dg-button-icon-default-host',
      standalone: true,
      imports: [DynamoButton],
      template: `<dg-button
        ><span icon data-testid="icon">*</span>Save</dg-button
      >`,
    })
    class ButtonIconDefaultHostComponent {}

    @Component({
      selector: 'dg-button-icon-pos-host',
      standalone: true,
      imports: [DynamoButton],
      template: `<dg-button [iconPos]="iconPos()" [loading]="loading()"
        ><span icon data-testid="icon">*</span>Save</dg-button
      >`,
    })
    class ButtonIconPosHostComponent {
      readonly iconPos = input<'left' | 'right' | 'top' | 'bottom'>('left');
      readonly loading = input(false);
    }

    it('renders no icon-slot content when nothing is projected into [icon] (regression)', () => {
      const { container } = renderDynamoComponent(ButtonTestHostComponent);

      expect(container.querySelector('[icon]')).toBeNull();
    });

    it('defaults iconPos to "left", rendering the icon ahead of the label', () => {
      const { container } = renderDynamoComponent(
        ButtonIconDefaultHostComponent,
      );

      const button = within(container).getByRole('button');
      expect(button.textContent?.trim().startsWith('*')).toBe(true);
      expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();
    });

    it('iconPos "right" visually reorders the icon after the label via CSS order (DOM/projection order stays fixed)', () => {
      const { container } = renderDynamoComponent(ButtonIconPosHostComponent, {
        inputs: { iconPos: 'right' },
      });

      // DOM order is unaffected by iconPos — Angular content projection
      // requires a single fixed `<ng-content select="[icon]">` location, so
      // reordering is achieved via the wrapper's `order-last` class instead.
      const button = within(container).getByRole('button');
      expect(button.textContent?.trim().startsWith('*')).toBe(true);

      const icon = container.querySelector(
        '[data-testid="icon"]',
      ) as HTMLElement;
      const wrapper = icon.parentElement as HTMLElement;
      expect(wrapper.className).toContain('order-last');
    });

    it('iconPos "top" applies flex-col', () => {
      const { container } = renderDynamoComponent(ButtonIconPosHostComponent, {
        inputs: { iconPos: 'top' },
      });
      expect(within(container).getByRole('button').className).toContain(
        'flex-col',
      );
    });

    it.each(['top', 'bottom'] as const)(
      'iconPos "%s" replaces the fixed size height with h-auto/min-h so stacked content is not clipped',
      (iconPos) => {
        const { container } = renderDynamoComponent(
          ButtonIconPosHostComponent,
          { inputs: { iconPos } },
        );

        const classes = within(container)
          .getByRole('button')
          .className.split(' ');
        expect(classes).toContain('h-auto');
        expect(classes).toContain('min-h-10');
        expect(classes).not.toContain('h-10');
      },
    );

    it('iconPos "bottom" applies flex-col', () => {
      const { container } = renderDynamoComponent(ButtonIconPosHostComponent, {
        inputs: { iconPos: 'bottom' },
      });
      expect(within(container).getByRole('button').className).toContain(
        'flex-col',
      );
    });

    it('iconPos "left"/"right" do not apply flex-col', () => {
      const { container } = renderDynamoComponent(ButtonIconPosHostComponent, {
        inputs: { iconPos: 'left' },
      });
      expect(within(container).getByRole('button').className).not.toContain(
        'flex-col',
      );
    });

    it('loading swaps in the spinner in place of the icon slot, regardless of iconPos', () => {
      const { container } = renderDynamoComponent(ButtonIconPosHostComponent, {
        inputs: { iconPos: 'right', loading: true },
      });

      expect(container.querySelector('[data-testid="icon"]')).toBeNull();
      expect(within(container).getByRole('button').textContent?.trim()).toBe(
        'Save',
      );
    });
  });

  describe('variant "link"', () => {
    it('has no background class and underlines on hover', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { variant: 'link' },
      });

      const className = within(container).getByRole('button').className;
      expect(className).toContain('hover:underline');
      expect(className).not.toContain('bg-primary');
      expect(className).not.toContain('hover:bg-primary');
    });
  });

  describe('raised', () => {
    it('defaults to false, omitting shadow-md', () => {
      const { container } = renderDynamoComponent(DynamoButton);
      expect(within(container).getByRole('button').className).not.toContain(
        'shadow-md',
      );
    });

    it('applies shadow-md when true', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { raised: true },
      });
      expect(within(container).getByRole('button').className).toContain(
        'shadow-md',
      );
    });

    it('composes with variant "text" (Raised Text)', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { raised: true, variant: 'text' },
      });
      const className = within(container).getByRole('button').className;
      expect(className).toContain('shadow-md');
      expect(className).toContain('bg-transparent');
    });
  });

  describe('rounded', () => {
    it('defaults to false, keeping rounded-md', () => {
      const { container } = renderDynamoComponent(DynamoButton);
      expect(within(container).getByRole('button').className).toContain(
        'rounded-md',
      );
    });

    it('applies rounded-full and removes rounded-md when true', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { rounded: true },
      });
      const className = within(container).getByRole('button').className;
      expect(className).toContain('rounded-full');
      expect(className).not.toContain('rounded-md');
    });
  });

  describe('iconOnly', () => {
    it.each([
      { size: 'sm', width: 'w-8' },
      { size: 'md', width: 'w-10' },
      { size: 'lg', width: 'w-12' },
    ] as const)(
      'applies a square width ($width) and px-0 for size "$size"',
      ({ size, width }) => {
        const { container } = renderDynamoComponent(DynamoButton, {
          inputs: { iconOnly: true, size },
        });
        const className = within(container).getByRole('button').className;
        expect(className).toContain(width);
        expect(className).toContain('px-0');
      },
    );

    it('has no axe violations for an icon-only button with ariaLabel', async () => {
      @Component({
        selector: 'dg-button-icon-only-host',
        standalone: true,
        imports: [DynamoButton],
        template: `<dg-button [iconOnly]="true" ariaLabel="Close"
          ><span icon>*</span></dg-button
        >`,
      })
      class ButtonIconOnlyHostComponent {}

      const { container } = renderDynamoComponent(ButtonIconOnlyHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('pt (passthrough)', () => {
    it('merges pt.root.class into the button className alongside the built-in classes', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { pt: { root: { class: 'ring-2 ring-danger' } } },
      });

      const className = within(container).getByRole('button').className;
      expect(className).toContain('ring-2');
      expect(className).toContain('ring-danger');
      expect(className).toContain('bg-primary');
    });

    it('merges pt.root.class even when unstyled is true, alongside styleClass', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: {
          unstyled: true,
          styleClass: 'custom-only',
          pt: { root: { class: 'extra-pt-class' } },
        },
      });

      const className = within(container).getByRole('button').className;
      expect(className).toContain('custom-only');
      expect(className).toContain('extra-pt-class');
    });

    it('sets an arbitrary pt.root attribute on the native button', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { pt: { root: { 'data-testid': 'save-button' } } },
      });

      expect(
        within(container).getByRole('button').getAttribute('data-testid'),
      ).toBe('save-button');
    });

    it('clears a previously-set pt.root attribute when pt changes', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoButton, {
        inputs: { pt: { root: { 'data-testid': 'save-button' } } },
      });
      expect(
        within(container).getByRole('button').hasAttribute('data-testid'),
      ).toBe(true);

      setInputs({ pt: { root: {} } });

      expect(
        within(container).getByRole('button').hasAttribute('data-testid'),
      ).toBe(false);
    });

    it('has no axe violations with pt set', async () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: {
          ariaLabel: 'Save',
          pt: { root: { 'data-testid': 'save-button' } },
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(ButtonTestHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations while disabled', async () => {
      const { container } = renderDynamoComponent(ButtonTestHostComponent, {
        inputs: { disabled: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('sets aria-busy="true" while loading so assistive tech announces the pending state', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { loading: true },
      });

      expect(
        within(container).getByRole('button').getAttribute('aria-busy'),
      ).toBe('true');
    });
  });

  describe('state changes', () => {
    it('is disabled while loading even if disabled was not explicitly set', () => {
      const { container } = renderDynamoComponent(DynamoButton, {
        inputs: { loading: true },
      });

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('re-enables the button when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoButton, {
        inputs: { loading: true },
      });
      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);

      setInputs({ loading: false });

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('renders with no projected content without throwing', () => {
      const { container } = renderDynamoComponent(DynamoButton);

      expect(within(container).getByRole('button').textContent?.trim()).toBe(
        '',
      );
    });

    it('handles very long projected text without throwing', () => {
      @Component({
        selector: 'dg-button-long-text-host',
        standalone: true,
        imports: [DynamoButton],
        template: `<dg-button>{{ longText }}</dg-button>`,
      })
      class LongTextHostComponent {
        longText = 'x'.repeat(500);
      }

      const { container } = renderDynamoComponent(LongTextHostComponent);

      expect(
        within(container).getByRole('button').textContent?.trim(),
      ).toHaveLength(500);
    });

    it('handles rapid repeated clicks without losing or duplicating events', () => {
      const { container } = renderDynamoComponent(DynamoButton);
      const onClick = vi.fn();
      container.addEventListener('click', onClick);
      const button = within(container).getByRole('button');

      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(onClick).toHaveBeenCalledTimes(10);
    });
  });
});
