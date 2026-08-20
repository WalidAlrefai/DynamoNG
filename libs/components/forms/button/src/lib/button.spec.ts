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
