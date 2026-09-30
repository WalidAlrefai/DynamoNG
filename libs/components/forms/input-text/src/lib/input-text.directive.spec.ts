import { Component, input } from '@angular/core';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoInputTextDirective } from './input-text.directive';
import type {
  DynamoInputTextSize,
  DynamoInputTextVariant,
} from './input-text.types';

@Component({
  selector: 'dg-input-text-directive-test-host',
  standalone: true,
  imports: [DynamoInputTextDirective],
  template: `<input
    dgInputText
    class="my-static-class"
    aria-label="Name"
    [size]="size()"
    [variant]="variant()"
    [invalid]="invalid()"
    [fluid]="fluid()"
  />`,
})
class InputTextDirectiveTestHostComponent {
  readonly size = input<DynamoInputTextSize>('md');
  readonly variant = input<DynamoInputTextVariant>('outlined');
  readonly invalid = input(false);
  readonly fluid = input(true);
}

describe('DynamoInputTextDirective', () => {
  it('applies the default inputTextStyles classes onto the native input', () => {
    const { container } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );

    const el = within(container).getByRole('textbox');
    expect(el.className).toContain('border-border');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('w-full');
  });

  it('preserves a pre-existing static class on the host element', () => {
    const { container } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );

    expect(within(container).getByRole('textbox').className).toContain(
      'my-static-class',
    );
  });

  it('reflects a variant change to filled, removing the outlined background', () => {
    const { container, setInputs } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );

    setInputs({ variant: 'filled' });

    const className = within(container).getByRole('textbox').className;
    expect(className).toContain('bg-surface-100');
    expect(className).not.toContain('bg-surface-0');
  });

  it('drops w-full when fluid is set to false', () => {
    const { container, setInputs } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );

    setInputs({ fluid: false });

    expect(within(container).getByRole('textbox').className).not.toContain(
      'w-full',
    );
  });

  it('sets aria-invalid="true" while invalid and omits it otherwise', () => {
    const { container, setInputs } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );
    expect(
      within(container).getByRole('textbox').hasAttribute('aria-invalid'),
    ).toBe(false);

    setInputs({ invalid: true });
    expect(
      within(container).getByRole('textbox').getAttribute('aria-invalid'),
    ).toBe('true');

    setInputs({ invalid: false });
    expect(
      within(container).getByRole('textbox').hasAttribute('aria-invalid'),
    ).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(
      InputTextDirectiveTestHostComponent,
    );
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
