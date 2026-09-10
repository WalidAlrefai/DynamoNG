import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoMeterGroup } from './meter-group';
import { DynamoMeterGroupHarness } from './meter-group.harness';
import type { DynamoMeterItem } from './meter-group.types';

const ITEMS: DynamoMeterItem[] = [
  { label: 'Documents', value: 30, severity: 'primary' },
  { label: 'Photos', value: 20, severity: 'info' },
  { label: 'Apps', value: 10, severity: 'warning' },
];

function segments(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll('[data-testid="DynamoMeterGroup-segment"]'),
  );
}

describe('DynamoMeterGroup', () => {
  describe('creation', () => {
    it('renders one role="meter" per item with value ARIA attributes', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS },
      });

      const meters = within(container).getAllByRole('meter');
      expect(meters).toHaveLength(3);
      expect(meters[0]?.getAttribute('aria-valuenow')).toBe('30');
      expect(meters[0]?.getAttribute('aria-valuemax')).toBe('100');
      expect(meters[0]?.getAttribute('aria-label')).toBe('Documents');
    });
  });

  describe('sizing', () => {
    it('sizes each segment as value / max (percent, via flex-basis)', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS, max: 100 },
      });

      const bases = segments(container).map((s) => s.style.flexBasis);
      expect(bases).toEqual(['30%', '20%', '10%']);
    });

    it('scales segments down proportionally when they would overflow max', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: {
          value: [
            { label: 'A', value: 60 },
            { label: 'B', value: 60 },
          ],
          max: 100,
        },
      });

      // sum 120 > 100 → each scaled by 100/120 → 50% each, sum exactly 100%.
      const bases = segments(container).map((s) =>
        Number.parseFloat(s.style.flexBasis),
      );
      expect(bases[0]).toBeCloseTo(50, 4);
      expect(bases[1]).toBeCloseTo(50, 4);
    });

    it('respects a custom max', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: {
          value: [{ label: 'Used', value: 128 }],
          max: 512,
        },
      });
      expect(segments(container)[0]?.style.flexBasis).toBe('25%');
    });
  });

  describe('colour', () => {
    it('an explicit `color` overrides the severity class with an inline style', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: {
          value: [{ label: 'Custom', value: 40, color: 'rgb(1, 2, 3)' }],
        },
      });
      const segment = segments(container)[0] as HTMLElement;
      expect(segment.style.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(segment.className).not.toContain('bg-primary');
    });

    it('falls back to the severity palette class when no color is set', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: [{ label: 'X', value: 10, severity: 'success' }] },
      });
      expect(segments(container)[0]?.className).toContain('bg-success');
    });
  });

  describe('legend', () => {
    it('renders a legend row per item by default', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS },
      });
      const legend = container.querySelector(
        '[data-testid="DynamoMeterGroup-legend"]',
      );
      expect(legend?.querySelectorAll('li')).toHaveLength(3);
      expect(legend?.textContent).toContain('Documents');
      expect(legend?.textContent).toContain('30');
    });

    it('hides the legend when showLegend is false', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS, showLegend: false },
      });
      expect(
        container.querySelector('[data-testid="DynamoMeterGroup-legend"]'),
      ).toBeNull();
    });
  });

  describe('orientation', () => {
    it('swaps the layout classes for vertical', () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS, orientation: 'vertical' },
      });
      const track = container.querySelector(
        '[data-testid="DynamoMeterGroup-track"]',
      ) as HTMLElement;
      expect(track.className).toContain('flex-col-reverse');
    });
  });

  describe('harness', () => {
    it('reports segment count, labels, percents, and legend presence', async () => {
      const { fixture } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMeterGroupHarness,
      );

      expect(await harness.getSegmentCount()).toBe(3);
      expect(await harness.getSegmentLabels()).toEqual([
        'Documents',
        'Photos',
        'Apps',
      ]);
      expect(await harness.getSegmentPercents()).toEqual([30, 20, 10]);
      expect(await harness.hasLegend()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS, ariaLabel: 'Storage breakdown' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations without a legend', async () => {
      const { container } = renderDynamoComponent(DynamoMeterGroup, {
        inputs: { value: ITEMS, showLegend: false },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
