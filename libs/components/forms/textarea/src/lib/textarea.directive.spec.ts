import { Component, input } from '@angular/core';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoTextareaDirective } from './textarea.directive';
import type {
  DynamoTextareaSize,
  DynamoTextareaVariant,
} from './textarea.types';

@Component({
  selector: 'dg-textarea-directive-test-host',
  standalone: true,
  imports: [DynamoTextareaDirective],
  template: `<textarea
    dgTextarea
    class="my-static-class"
    aria-label="Bio"
    [size]="size()"
    [variant]="variant()"
    [invalid]="invalid()"
    [fluid]="fluid()"
    [autoResize]="autoResize()"
  ></textarea>`,
})
class TextareaDirectiveTestHostComponent {
  readonly size = input<DynamoTextareaSize>('md');
  readonly variant = input<DynamoTextareaVariant>('outlined');
  readonly invalid = input(false);
  readonly fluid = input(true);
  readonly autoResize = input(false);
}

describe('DynamoTextareaDirective', () => {
  it('applies the default textareaStyles classes onto the native textarea', () => {
    const { container } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );

    const el = within(container).getByRole('textbox');
    expect(el.className).toContain('border-border');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('w-full');
  });

  it('preserves a pre-existing static class on the host element', () => {
    const { container } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );

    expect(within(container).getByRole('textbox').className).toContain(
      'my-static-class',
    );
  });

  it('reflects a variant change to filled, removing the outlined background', () => {
    const { container, setInputs } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );

    setInputs({ variant: 'filled' });

    const className = within(container).getByRole('textbox').className;
    expect(className).toContain('bg-surface-100');
    expect(className).not.toContain('bg-surface-0');
  });

  it('drops w-full when fluid is set to false', () => {
    const { container, setInputs } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );

    setInputs({ fluid: false });

    expect(within(container).getByRole('textbox').className).not.toContain(
      'w-full',
    );
  });

  it('sets aria-invalid="true" while invalid and omits it otherwise', () => {
    const { container, setInputs } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
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

  it('applies resize-none/overflow-hidden classes only while autoResize is on', () => {
    const { container, setInputs } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );
    expect(within(container).getByRole('textbox').className).toContain(
      'resize-y',
    );

    setInputs({ autoResize: true });
    const className = within(container).getByRole('textbox').className;
    expect(className).toContain('resize-none');
    expect(className).toContain('overflow-hidden');
  });

  it('resizes the native element height on input while autoResize is on', async () => {
    const { container, setInputs } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
      { inputs: { autoResize: true } },
    );
    setInputs({ autoResize: true });
    const el = within(container).getByRole('textbox') as HTMLTextAreaElement;

    await userEvent.type(el, 'hello');

    // jsdom has no real layout, so scrollHeight is always 0 — this just
    // asserts the resize logic actually ran (an explicit inline height was
    // set), not a specific pixel value.
    expect(el.style.height).not.toBe('');
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(
      TextareaDirectiveTestHostComponent,
    );
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
