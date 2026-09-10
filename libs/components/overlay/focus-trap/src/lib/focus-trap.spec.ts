import { Component, signal } from '@angular/core';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoFocusTrap } from './focus-trap';

@Component({
  selector: 'dg-focus-trap-host',
  standalone: true,
  imports: [DynamoFocusTrap],
  template: `
    <button type="button" data-testid="outside-before">before</button>
    <div [dgFocusTrap]="on()">
      <button type="button" data-testid="first">first</button>
      <button type="button" data-testid="middle">middle</button>
      <button type="button" data-testid="last">last</button>
    </div>
    <button type="button" data-testid="outside-after">after</button>
  `,
})
class FocusTrapHostComponent {
  readonly on = signal(true);
}

describe('DynamoFocusTrap', () => {
  it('keeps Tab from the last focusable inside the region', async () => {
    const { container } = renderDynamoComponent(FocusTrapHostComponent);
    const last = within(container).getByTestId('last') as HTMLButtonElement;
    last.focus();

    await userEvent.tab();

    // CDK's trap redirects focus back into the region rather than to
    // "outside-after".
    expect(document.activeElement).not.toBe(
      within(container).getByTestId('outside-after'),
    );
    expect(container.contains(document.activeElement)).toBe(true);
  });

  it('keeps Shift+Tab from the first focusable inside the region', async () => {
    const { container } = renderDynamoComponent(FocusTrapHostComponent);
    const first = within(container).getByTestId('first') as HTMLButtonElement;
    first.focus();

    await userEvent.tab({ shift: true });

    expect(document.activeElement).not.toBe(
      within(container).getByTestId('outside-before'),
    );
    expect(container.contains(document.activeElement)).toBe(true);
  });

  it('releases the trap when the bound value goes false', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      FocusTrapHostComponent,
    );
    componentInstance.on.set(false);
    fixture.detectChanges();

    // With the trap released, CDK's anchor elements are gone.
    expect(
      container.querySelectorAll('.cdk-focus-trap-anchor').length,
    ).toBe(0);
  });

  it('installs CDK focus-trap anchors while enabled', () => {
    const { container } = renderDynamoComponent(FocusTrapHostComponent);
    expect(
      container.querySelectorAll('.cdk-focus-trap-anchor').length,
    ).toBeGreaterThan(0);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(FocusTrapHostComponent);
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
