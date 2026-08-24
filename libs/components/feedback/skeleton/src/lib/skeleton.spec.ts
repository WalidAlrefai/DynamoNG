import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoSkeleton } from './skeleton';
import { DynamoSkeletonHarness } from './skeleton.harness';

describe('DynamoSkeleton', () => {
  describe('creation', () => {
    it('renders a single decorative div', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton);

      const div = container.querySelector('div');
      expect(div).toBeTruthy();
      expect(div?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('default behavior', () => {
    it('defaults variant to "text"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSkeleton);

      expect(componentInstance.variant()).toBe('text');
    });

    it('applies the text variant default size classes', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton);

      const div = container.querySelector('div');
      expect(div?.className).toContain('h-4');
      expect(div?.className).toContain('w-full');
    });
  });

  describe('input properties', () => {
    it('applies circular variant classes', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton, {
        inputs: { variant: 'circular' },
      });

      const div = container.querySelector('div');
      expect(div?.className).toContain('rounded-full');
      expect(div?.className).toContain('h-10');
      expect(div?.className).toContain('w-10');
    });

    it('applies rectangular variant classes', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton, {
        inputs: { variant: 'rectangular' },
      });

      const div = container.querySelector('div');
      expect(div?.className).toContain('rounded-md');
      expect(div?.className).toContain('h-24');
    });

    it('renders a numeric width as pixels via an inline style', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton, {
        inputs: { width: 200 },
      });

      const div = container.querySelector('div') as HTMLElement;
      expect(div.style.width).toBe('200px');
    });

    it('passes a string width through as-is', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton, {
        inputs: { width: '50%' },
      });

      const div = container.querySelector('div') as HTMLElement;
      expect(div.style.width).toBe('50%');
    });

    it('leaves width/height unset when not provided', () => {
      const { container } = renderDynamoComponent(DynamoSkeleton);

      const div = container.querySelector('div') as HTMLElement;
      expect(div.style.width).toBe('');
      expect(div.style.height).toBe('');
    });

    it('supports interaction through the DynamoSkeletonHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSkeleton, {
        inputs: { width: 120 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSkeletonHarness,
      );

      expect(await harness.getWidth()).toBe('120px');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(DynamoSkeleton);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('does not throw when width and height are both unset', () => {
      expect(() => renderDynamoComponent(DynamoSkeleton)).not.toThrow();
    });
  });
});
