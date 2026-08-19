import { Component, input } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { describe, expect, it } from 'vitest';
import { DynamoChip } from './chip';
import { DynamoChipHarness } from './chip.harness';
import type { DynamoChipVariant } from './chip.types';

@Component({
  selector: 'dg-chip-test-host',
  standalone: true,
  imports: [DynamoChip],
  template: `<dg-chip
    [severity]="severity()"
    [variant]="variant()"
    [size]="size()"
    [removable]="removable()"
    [removeAriaLabel]="removeAriaLabel()"
    (removed)="onRemoved()"
    >{{ label() }}</dg-chip
  >`,
})
class ChipTestHostComponent {
  readonly label = input('Frontend');
  readonly severity = input<DynamoSeverity>('primary');
  readonly variant = input<DynamoChipVariant>('solid');
  readonly size = input<DynamoSize>('md');
  readonly removable = input(false);
  readonly removeAriaLabel = input('Remove');
  removedCount = 0;

  onRemoved(): void {
    this.removedCount++;
  }
}

describe('DynamoChip', () => {
  describe('creation', () => {
    it('renders projected content', () => {
      const { container } = renderDynamoComponent(ChipTestHostComponent);

      expect(container.textContent).toContain('Frontend');
    });

    it('does not throw when rendered with no projected content', () => {
      expect(() => renderDynamoComponent(DynamoChip)).not.toThrow();
    });
  });

  describe('default behavior', () => {
    it('defaults severity to "primary", variant to "solid", size to "md", removable to false', () => {
      const { componentInstance } = renderDynamoComponent(DynamoChip);

      expect(componentInstance.severity()).toBe('primary');
      expect(componentInstance.variant()).toBe('solid');
      expect(componentInstance.size()).toBe('md');
      expect(componentInstance.removable()).toBe(false);
    });

    it('reflects the primary/solid defaults as solid background classes', () => {
      const { container } = renderDynamoComponent(DynamoChip);

      const chip = container.querySelector('span');
      expect(chip?.className).toContain('bg-primary');
      expect(chip?.className).toContain('text-on-primary');
    });
  });

  describe('input properties', () => {
    it.each([
      'primary',
      'secondary',
      'success',
      'info',
      'warning',
      'danger',
    ] as const)(
      'applies solid background/text classes for severity "%s"',
      (severity) => {
        const { container } = renderDynamoComponent(ChipTestHostComponent, {
          inputs: { severity },
        });

        const chip = container.querySelector('span');
        expect(chip?.className).toContain(`bg-${severity}`);
        expect(chip?.className).toContain(`text-on-${severity}`);
      },
    );

    it('applies outline classes (bordered, transparent background) when variant is "outline"', () => {
      const { container } = renderDynamoComponent(ChipTestHostComponent, {
        inputs: { variant: 'outline' },
      });

      const chip = container.querySelector('span');
      expect(chip?.className).toContain('bg-transparent');
      expect(chip?.className).toContain('border-primary');
      expect(chip?.className).toContain('text-primary');
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'accepts size "%s" without throwing',
      (size) => {
        expect(() =>
          renderDynamoComponent(ChipTestHostComponent, { inputs: { size } }),
        ).not.toThrow();
      },
    );

    it('applies the removeAriaLabel to the remove button', () => {
      const { container } = renderDynamoComponent(ChipTestHostComponent, {
        inputs: { removable: true, removeAriaLabel: 'Remove Frontend' },
      });

      expect(
        container.querySelector('button')?.getAttribute('aria-label'),
      ).toBe('Remove Frontend');
    });
  });

  describe('output events', () => {
    it('emits removed when the remove button is clicked', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ChipTestHostComponent,
        { inputs: { removable: true } },
      );
      const removeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      removeButton.click();
      fixture.detectChanges();

      expect(componentInstance.removedCount).toBe(1);
    });
  });

  describe('user interactions', () => {
    it('does not remove itself from the DOM when removed is emitted', () => {
      const { container, fixture } = renderDynamoComponent(
        ChipTestHostComponent,
        { inputs: { removable: true } },
      );
      const removeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      removeButton.click();
      fixture.detectChanges();

      // Removal is the consumer's responsibility (array manipulation), not
      // the chip's own — it stays mounted after emitting `removed`.
      expect(
        container.querySelector('[data-testid="DynamoChip"]'),
      ).not.toBeNull();
    });
  });

  describe('conditional rendering', () => {
    it('renders a remove button only when removable is true', () => {
      const { container } = renderDynamoComponent(DynamoChip);

      expect(container.querySelector('button')).toBeNull();
    });

    it('renders a remove button when removable is true', () => {
      const { container } = renderDynamoComponent(DynamoChip, {
        inputs: { removable: true },
      });

      expect(container.querySelector('button')).not.toBeNull();
    });
  });

  describe('template behavior', () => {
    it('skips all built-in classes when unstyled is true, keeping only styleClass', () => {
      const { container } = renderDynamoComponent(DynamoChip, {
        inputs: { unstyled: true, styleClass: 'custom-chip' },
      });

      expect(container.querySelector('span')?.className).toBe('custom-chip');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(ChipTestHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations when removable', async () => {
      const { fixture } = renderDynamoComponent(ChipTestHostComponent, {
        inputs: { removable: true },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('shows the remove button after removable is toggled on', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        DynamoChip,
        { inputs: { removable: false } },
      );
      expect(container.querySelector('button')).toBeNull();

      setInputs({ removable: true });
      fixture.detectChanges();

      expect(container.querySelector('button')).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles rapid repeated remove clicks without throwing', () => {
      const { container, fixture } = renderDynamoComponent(
        ChipTestHostComponent,
        { inputs: { removable: true } },
      );
      const removeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(() => {
        for (let i = 0; i < 5; i++) {
          removeButton.click();
          fixture.detectChanges();
        }
      }).not.toThrow();
    });
  });

  describe('harness', () => {
    it('reads text and removability through the DynamoChipHarness', async () => {
      const { fixture } = renderDynamoComponent(ChipTestHostComponent, {
        inputs: { label: 'Backend', removable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoChipHarness,
      );

      expect(await harness.getText()).toBe('Backend');
      expect(await harness.isRemovable()).toBe(true);
    });

    it('emits removed through the harness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        ChipTestHostComponent,
        { inputs: { removable: true } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoChipHarness,
      );

      await harness.remove();

      expect(componentInstance.removedCount).toBe(1);
    });
  });
});
