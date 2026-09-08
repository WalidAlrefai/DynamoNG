import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoInputGroup } from './input-group';
import { DynamoInputGroupHarness } from './input-group.harness';

@Component({
  selector: 'dg-input-group-test-host',
  standalone: true,
  imports: [DynamoInputGroup],
  template: `
    <dg-input-group [size]="size" [invalid]="invalid">
      <span prefix>$</span>
      <input type="text" placeholder="Amount" />
      <span suffix>.00</span>
    </dg-input-group>
  `,
})
class InputGroupTestHostComponent {
  size: 'sm' | 'md' | 'lg' = 'md';
  invalid = false;
}

@Component({
  selector: 'dg-input-group-empty-host',
  standalone: true,
  imports: [DynamoInputGroup],
  template: `
    <dg-input-group>
      <input type="text" placeholder="No addons" />
    </dg-input-group>
  `,
})
class InputGroupEmptyHostComponent {}

describe('DynamoInputGroup', () => {
  describe('creation', () => {
    it('projects prefix, default, and suffix content into their own slots', () => {
      const { fixture } = renderDynamoComponent(InputGroupTestHostComponent);
      const container = fixture.nativeElement as HTMLElement;

      expect(
        container.querySelector('[data-testid="dg-input-group-prefix"]')?.textContent?.trim(),
      ).toBe('$');
      expect(container.querySelector('input[placeholder="Amount"]')).not.toBeNull();
      expect(
        container.querySelector('[data-testid="dg-input-group-suffix"]')?.textContent?.trim(),
      ).toBe('.00');
    });
  });

  describe('default behavior', () => {
    it('renders empty prefix/suffix slots without layout breakage when nothing is projected', () => {
      const { fixture } = renderDynamoComponent(InputGroupEmptyHostComponent);
      const container = fixture.nativeElement as HTMLElement;

      expect(container.querySelector('[data-testid="dg-input-group-prefix"]')?.textContent?.trim()).toBe(
        '',
      );
      expect(container.querySelector('[data-testid="dg-input-group-suffix"]')?.textContent?.trim()).toBe(
        '',
      );
      expect(container.querySelector('input[placeholder="No addons"]')).not.toBeNull();
    });
  });

  describe('input properties', () => {
    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoInputGroup, { inputs: {} });

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });

    it('defaults invalid to false', () => {
      const { componentInstance } = renderDynamoComponent(DynamoInputGroup, { inputs: {} });

      expect(componentInstance.invalid()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('the wrapper reacts to focus-within when the projected input is focused', () => {
      const { fixture } = renderDynamoComponent(InputGroupTestHostComponent);
      const container = fixture.nativeElement as HTMLElement;
      const wrapper = container.querySelector('div') as HTMLElement;
      const input = container.querySelector('input') as HTMLInputElement;

      input.focus();

      expect(wrapper.matches(':focus-within')).toBe(true);
    });

    it('supports interaction through the DynamoInputGroupHarness', async () => {
      const { fixture } = renderDynamoComponent(InputGroupTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoInputGroupHarness);

      expect(await harness.getPrefixText()).toBe('$');
      expect(await harness.getSuffixText()).toBe('.00');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with prefix/suffix content and a labeled input', () => {
      const { fixture } = renderDynamoComponent(InputGroupTestHostComponent);
      const container = fixture.nativeElement as HTMLElement;
      within(container).getByPlaceholderText('Amount').setAttribute('aria-label', 'Amount');
      return expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders with no prefix, suffix, or default content without throwing', () => {
      expect(() => {
        renderDynamoComponent(DynamoInputGroup, { inputs: {} });
      }).not.toThrow();
    });
  });
});
