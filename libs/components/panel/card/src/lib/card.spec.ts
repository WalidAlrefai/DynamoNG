import { Component, input } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoCard } from './card';
import { DynamoCardHarness } from './card.harness';
import type { DynamoCardVariant } from './card.types';

@Component({
  selector: 'dg-card-test-host',
  standalone: true,
  imports: [DynamoCard],
  template: `<dg-card
    [header]="header()"
    [subheader]="subheader()"
    [variant]="variant()"
  >
    {{ body() }}
    <button footer type="button">Action</button>
  </dg-card>`,
})
class CardTestHostComponent {
  readonly header = input('');
  readonly subheader = input('');
  readonly variant = input<DynamoCardVariant>('elevated');
  readonly body = input('Card body content');
}

describe('DynamoCard', () => {
  describe('creation', () => {
    it('renders without errors and has the expected host element', () => {
      const { container } = renderDynamoComponent(DynamoCard);

      expect(
        container.querySelector('[data-testid="DynamoCard"]'),
      ).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults variant to "elevated" with no header/subheader', () => {
      const { componentInstance, container } =
        renderDynamoComponent(DynamoCard);

      expect(componentInstance.variant()).toBe('elevated');
      const root = container.querySelector('[data-testid="DynamoCard"]');
      expect(root?.className).toContain('shadow-md');
      expect(root?.className).toContain('bg-surface-0');
    });

    it('renders no header block when header/subheader are unset', () => {
      const { container } = renderDynamoComponent(DynamoCard);

      expect(
        container.querySelector('[data-testid="DynamoCard-title"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="DynamoCard-subtitle"]'),
      ).toBeNull();
    });
  });

  describe('input properties', () => {
    it('reflects the header and subheader text', () => {
      const { container } = renderDynamoComponent(CardTestHostComponent, {
        inputs: { header: 'Title', subheader: 'Subtitle' },
      });

      expect(
        container
          .querySelector('[data-testid="DynamoCard-title"]')
          ?.textContent?.trim(),
      ).toBe('Title');
      expect(
        container
          .querySelector('[data-testid="DynamoCard-subtitle"]')
          ?.textContent?.trim(),
      ).toBe('Subtitle');
    });

    it.each(['elevated', 'outlined', 'filled'] as const)(
      'applies the expected classes for variant "%s"',
      (variant) => {
        const { container } = renderDynamoComponent(CardTestHostComponent, {
          inputs: { variant },
        });

        const root = container.querySelector('[data-testid="DynamoCard"]');
        if (variant === 'elevated') {
          expect(root?.className).toContain('shadow-md');
        } else if (variant === 'outlined') {
          expect(root?.className).toContain('border-border');
        } else {
          expect(root?.className).toContain('bg-surface-100');
        }
      },
    );
  });

  describe('output events', () => {
    it.todo('N/A — Card is presentational and has no outputs');
  });

  describe('user interactions', () => {
    it.todo('N/A — Card is presentational and has no built-in interactions');
  });

  describe('conditional rendering', () => {
    it('renders the title element only when header is set', () => {
      const { container } = renderDynamoComponent(CardTestHostComponent, {
        inputs: { header: 'Title' },
      });

      expect(
        container.querySelector('[data-testid="DynamoCard-title"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoCard-subtitle"]'),
      ).toBeNull();
    });

    it('projects footer content when supplied', () => {
      const { container } = renderDynamoComponent(CardTestHostComponent);

      expect(container.querySelector('button[footer]')).toBeTruthy();
    });
  });

  describe('template behavior', () => {
    it('projects default-slot body content', () => {
      const { container } = renderDynamoComponent(CardTestHostComponent, {
        inputs: { body: 'Hello from the body' },
      });

      expect(container.textContent).toContain('Hello from the body');
    });

    it('skips all built-in classes when unstyled is true, keeping only styleClass', () => {
      const { container } = renderDynamoComponent(DynamoCard, {
        inputs: { unstyled: true, styleClass: 'custom-card' },
      });

      expect(
        container.querySelector('[data-testid="DynamoCard"]')?.className,
      ).toBe('custom-card');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(DynamoCard);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a header, subheader, and footer', async () => {
      const { fixture } = renderDynamoComponent(CardTestHostComponent, {
        inputs: { header: 'Title', subheader: 'Subtitle' },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it.todo('N/A — Card has no internal state transitions');
  });

  describe('edge cases', () => {
    it('handles very long header/subheader text without throwing', () => {
      const longText = 'A'.repeat(500);

      expect(() =>
        renderDynamoComponent(CardTestHostComponent, {
          inputs: { header: longText, subheader: longText },
        }),
      ).not.toThrow();
    });

    it('renders with no projected content at all', () => {
      expect(() => renderDynamoComponent(DynamoCard)).not.toThrow();
    });
  });

  describe('harness', () => {
    it('reads header/subheader text through the DynamoCardHarness', async () => {
      const { fixture } = renderDynamoComponent(CardTestHostComponent, {
        inputs: { header: 'Title', subheader: 'Subtitle' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCardHarness,
      );

      expect(await harness.getHeaderText()).toBe('Title');
      expect(await harness.getSubheaderText()).toBe('Subtitle');
    });

    it('returns null from the harness when header/subheader are unset', async () => {
      const { fixture } = renderDynamoComponent(DynamoCard);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCardHarness,
      );

      expect(await harness.getHeaderText()).toBeNull();
      expect(await harness.getSubheaderText()).toBeNull();
    });
  });
});
