import { Component, input } from '@angular/core';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoButtonDirective } from './button.directive';
import type { DynamoButtonVariant } from './button.types';

@Component({
  selector: 'dg-button-directive-test-host',
  standalone: true,
  imports: [DynamoButtonDirective],
  template: `<button
    dgButton
    class="my-static-class"
    [severity]="severity()"
    [variant]="variant()"
    [raised]="raised()"
    [rounded]="rounded()"
    [iconOnly]="iconOnly()"
    [disabled]="disabled()"
    [loading]="loading()"
  >
    Save
  </button>`,
})
class ButtonDirectiveTestHostComponent {
  readonly severity = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly raised = input(false);
  readonly rounded = input(false);
  readonly iconOnly = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
}

describe('DynamoButtonDirective', () => {
  it('applies the default buttonStyles classes onto the native button', () => {
    const { container } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    const button = within(container).getByRole('button');
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('inline-flex');
  });

  it('preserves a pre-existing static class on the host element', () => {
    const { container } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    expect(within(container).getByRole('button').className).toContain(
      'my-static-class',
    );
  });

  it('reflects a severity change, removing the stale class', () => {
    const { container, setInputs } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    setInputs({ severity: 'danger' });

    const className = within(container).getByRole('button').className;
    expect(className).toContain('bg-danger');
    expect(className).not.toContain('bg-primary');
  });

  it('applies raised (shadow-md) and rounded (rounded-full, no rounded-md)', () => {
    const { container, setInputs } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    setInputs({ raised: true, rounded: true });

    const className = within(container).getByRole('button').className;
    expect(className).toContain('shadow-md');
    expect(className).toContain('rounded-full');
    expect(className).not.toContain('rounded-md');
  });

  it('sets the native disabled property when disabled is true', () => {
    const { container, setInputs } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    setInputs({ disabled: true });

    expect(
      (within(container).getByRole('button') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('sets the native disabled property when loading is true, even if disabled is not explicitly set', () => {
    const { container, setInputs } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );

    setInputs({ loading: true });

    expect(
      (within(container).getByRole('button') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('sets aria-busy="true" while loading and omits it otherwise', () => {
    const { container, setInputs } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );
    expect(
      within(container).getByRole('button').hasAttribute('aria-busy'),
    ).toBe(false);

    setInputs({ loading: true });
    expect(
      within(container).getByRole('button').getAttribute('aria-busy'),
    ).toBe('true');

    setInputs({ loading: false });
    expect(
      within(container).getByRole('button').hasAttribute('aria-busy'),
    ).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(
      ButtonDirectiveTestHostComponent,
    );
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
