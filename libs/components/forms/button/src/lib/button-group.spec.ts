import { Component } from '@angular/core';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoButton } from './button';
import { DynamoButtonGroup } from './button-group';

@Component({
  selector: 'dg-button-group-test-host',
  standalone: true,
  imports: [DynamoButtonGroup, DynamoButton],
  template: `
    <dg-button-group ariaLabel="Text formatting">
      <dg-button>Bold</dg-button>
      <dg-button>Italic</dg-button>
      <dg-button>Underline</dg-button>
    </dg-button-group>
  `,
})
class ButtonGroupTestHostComponent {}

describe('DynamoButtonGroup', () => {
  it('renders a group role wrapping every projected button', () => {
    const { container } = renderDynamoComponent(ButtonGroupTestHostComponent);

    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.querySelectorAll('dg-button')).toHaveLength(3);
  });

  it('forwards ariaLabel to the group element', () => {
    const { container } = renderDynamoComponent(ButtonGroupTestHostComponent);

    expect(
      container.querySelector('[role="group"]')?.getAttribute('aria-label'),
    ).toBe('Text formatting');
  });

  it('omits aria-label entirely when ariaLabel is unset', () => {
    const { container } = renderDynamoComponent(DynamoButtonGroup);

    expect(
      container.querySelector('[role="group"]')?.hasAttribute('aria-label'),
    ).toBe(false);
  });

  it('projects each button unchanged, preserving its own content', () => {
    const { container } = renderDynamoComponent(ButtonGroupTestHostComponent);

    expect(
      within(container).getByRole('button', { name: 'Bold' }),
    ).toBeTruthy();
    expect(
      within(container).getByRole('button', { name: 'Italic' }),
    ).toBeTruthy();
    expect(
      within(container).getByRole('button', { name: 'Underline' }),
    ).toBeTruthy();
  });

  it('renders with no children without throwing', () => {
    expect(() => renderDynamoComponent(DynamoButtonGroup)).not.toThrow();
  });

  it('skips buttonGroupRootStyles when unstyled is true, keeping only styleClass', () => {
    const { container } = renderDynamoComponent(DynamoButtonGroup, {
      inputs: { unstyled: true, styleClass: 'custom-only' },
    });

    expect(container.querySelector('[role="group"]')?.className).toBe(
      'custom-only',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(ButtonGroupTestHostComponent);
    await expectNoA11yViolations(container);
  });
});
