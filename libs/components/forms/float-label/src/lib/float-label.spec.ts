import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoFloatLabel } from './float-label';
import {
  DynamoFloatLabelHarness,
  DynamoIftaLabelHarness,
} from './float-label.harness';
import { DynamoIftaLabel } from './ifta-label';

@Component({
  selector: 'dg-float-label-host',
  standalone: true,
  imports: [DynamoFloatLabel],
  template: `
    <dg-float-label [label]="label()" [variant]="variant()">
      <input type="text" placeholder=" " [value]="value()" />
    </dg-float-label>
  `,
})
class FloatLabelHostComponent {
  readonly label = signal('Email');
  readonly variant = signal<'over' | 'in' | 'on'>('over');
  readonly value = signal('');
}

@Component({
  selector: 'dg-ifta-label-host',
  standalone: true,
  imports: [DynamoIftaLabel],
  template: `
    <dg-ifta-label label="Email">
      <input type="text" placeholder=" " />
    </dg-ifta-label>
  `,
})
class IftaLabelHostComponent {}

describe('DynamoFloatLabel', () => {
  describe('creation', () => {
    it('renders a <label> wrapping the projected control (implicit association)', () => {
      const { container } = renderDynamoComponent(FloatLabelHostComponent);
      const label = container.querySelector('label') as HTMLLabelElement;

      expect(label).toBeTruthy();
      expect(label.querySelector('input')).toBeTruthy();
      expect(label.textContent).toContain('Email');
      // testing-library resolves the accessible name via the wrapping label.
      expect(within(container).getByRole('textbox', { name: 'Email' })).toBeTruthy();
    });
  });

  describe('input properties', () => {
    it('reflects the label text', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        FloatLabelHostComponent,
      );
      componentInstance.label.set('Full name');
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="DynamoFloatLabel-label"]')
          ?.textContent,
      ).toContain('Full name');
    });

    it('applies variant-specific classes to the floating text', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        FloatLabelHostComponent,
      );
      const text = container.querySelector(
        '[data-testid="DynamoFloatLabel-label"]',
      ) as HTMLElement;

      // shared floated treatment (shrink to text-xs on fill), all variants
      expect(text.className).toContain(
        'group-has-[:is(input,textarea):not(:placeholder-shown)]:text-xs',
      );
      // default `over` lifts the label onto the border
      expect(text.className).toContain('group-has-[:focus]:-top-2');

      // `in` variant keeps the floated label inside the field
      componentInstance.variant.set('in');
      fixture.detectChanges();
      expect(text.className).not.toContain('group-has-[:focus]:-top-2');
      expect(text.className).toContain('group-has-[:focus]:top-1');

      componentInstance.variant.set('on');
      fixture.detectChanges();
      expect(text.className).toContain('group-has-[:focus]:bg-surface-0');
    });
  });

  describe('unstyled', () => {
    it('emits only styleClass on the root when unstyled', () => {
      @Component({
        selector: 'dg-fl-unstyled-host',
        standalone: true,
        imports: [DynamoFloatLabel],
        template: `<dg-float-label label="X" [unstyled]="true" styleClass="mine">
          <input placeholder=" " />
        </dg-float-label>`,
      })
      class UnstyledHost {}

      const { container } = renderDynamoComponent(UnstyledHost);
      const label = container.querySelector('label') as HTMLElement;
      expect(label.className).toBe('mine');
    });
  });

  describe('harness', () => {
    it('reads the label text', async () => {
      const { fixture } = renderDynamoComponent(FloatLabelHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFloatLabelHarness,
      );
      expect(await harness.getLabelText()).toBe('Email');
      // jsdom doesn't apply `:has()` in getComputedStyle, so isFloating() is
      // only smoke-checked here (verified visually in a real browser).
      expect(typeof (await harness.isFloating())).toBe('boolean');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(FloatLabelHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});

describe('DynamoIftaLabel', () => {
  it('renders a <label> wrapping the control with an always-visible label', () => {
    const { container } = renderDynamoComponent(IftaLabelHostComponent);
    const label = container.querySelector('label') as HTMLLabelElement;

    expect(label.querySelector('input')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="DynamoIftaLabel-label"]')
        ?.textContent,
    ).toContain('Email');
    expect(within(container).getByRole('textbox', { name: 'Email' })).toBeTruthy();
  });

  it('adds top padding to the projected control via a descendant selector', () => {
    const { container } = renderDynamoComponent(IftaLabelHostComponent);
    const label = container.querySelector('label') as HTMLElement;
    expect(label.className).toContain('[&_:is(input,textarea,select)]:pt-5');
  });

  it('exposes the label via the harness', async () => {
    const { fixture } = renderDynamoComponent(IftaLabelHostComponent);
    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      DynamoIftaLabelHarness,
    );
    expect(await harness.getLabelText()).toBe('Email');
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(IftaLabelHostComponent);
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
