import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoTimeline } from './timeline';
import { DynamoTimelineItem } from './timeline-item';
import { DynamoTimelineHarness } from './timeline.harness';

@Component({
  selector: 'dg-timeline-test-host',
  standalone: true,
  imports: [DynamoTimeline, DynamoTimelineItem],
  template: `
    <dg-timeline ariaLabel="Order status">
      <dg-timeline-item severity="success">
        <p data-testid="item-0">Placed — Jan 1</p>
      </dg-timeline-item>
      <dg-timeline-item severity="info">
        <p data-testid="item-1">Shipped — Jan 2</p>
      </dg-timeline-item>
      <dg-timeline-item severity="primary" styleClass="custom-content">
        <p data-testid="item-2">Delivered — Jan 3</p>
      </dg-timeline-item>
    </dg-timeline>
  `,
})
class TimelineTestHostComponent {}

@Component({
  selector: 'dg-timeline-single-item-host',
  standalone: true,
  imports: [DynamoTimeline, DynamoTimelineItem],
  template: `
    <dg-timeline>
      <dg-timeline-item>
        <p data-testid="only-item">Placed</p>
      </dg-timeline-item>
    </dg-timeline>
  `,
})
class TimelineSingleItemHostComponent {}

@Component({
  selector: 'dg-timeline-empty-item-host',
  standalone: true,
  imports: [DynamoTimeline, DynamoTimelineItem],
  template: `
    <dg-timeline>
      <dg-timeline-item />
    </dg-timeline>
  `,
})
class TimelineEmptyItemHostComponent {}

describe('DynamoTimeline', () => {
  describe('creation', () => {
    it('renders role="list" with role="listitem" entries, content projected into each', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);

      expect(within(container).getByRole('list')).toBeTruthy();
      expect(within(container).getAllByRole('listitem')).toHaveLength(3);
      expect(within(container).getByTestId('item-0').textContent).toContain(
        'Placed',
      );
      expect(within(container).getByTestId('item-1').textContent).toContain(
        'Shipped',
      );
      expect(within(container).getByTestId('item-2').textContent).toContain(
        'Delivered',
      );
    });
  });

  describe('input properties', () => {
    it('applies a distinct dot class per severity', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);
      const dots = container.querySelectorAll(
        '[data-testid="DynamoTimelineItem-dot"]',
      );

      const [success, info, primary] = Array.from(dots).map(
        (dot) => dot.className,
      );
      expect(success).toContain('bg-success');
      expect(info).toContain('bg-info');
      expect(primary).toContain('bg-primary');
      expect(success).not.toBe(info);
    });

    it('defaults severity to "primary"', () => {
      const { container } = renderDynamoComponent(
        TimelineSingleItemHostComponent,
      );

      expect(
        container.querySelector('[data-testid="DynamoTimelineItem-dot"]')
          ?.className,
      ).toContain('bg-primary');
    });

    it('falls back aria-label to null when unset', () => {
      const { container } = renderDynamoComponent(
        TimelineSingleItemHostComponent,
      );

      expect(
        within(container).getByRole('list').getAttribute('aria-label'),
      ).toBeNull();
    });

    it('reflects the provided ariaLabel', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);

      expect(
        within(container).getByRole('list').getAttribute('aria-label'),
      ).toBe('Order status');
    });

    it('applies styleClass to the content area, not the marker column', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);
      const contents = container.querySelectorAll(
        '[data-testid="DynamoTimelineItem-content"]',
      );
      const markers = container.querySelectorAll(
        '[data-testid="DynamoTimelineItem-marker"]',
      );

      expect(contents[2]?.className).toContain('custom-content');
      expect(markers[2]?.className).not.toContain('custom-content');
    });
  });

  describe('template behavior', () => {
    it('gives every connector the static group-last:hidden class (browser CSS decides visibility)', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);
      const connectors = container.querySelectorAll(
        '[data-testid="DynamoTimelineItem-connector"]',
      );

      expect(connectors).toHaveLength(3);
      for (const connector of Array.from(connectors)) {
        expect(connector.className).toContain('group-last:hidden');
      }
    });

    it('marks every item host with the structural "group" class', () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);
      const items = container.querySelectorAll('dg-timeline-item');

      expect(items).toHaveLength(3);
      for (const item of Array.from(items)) {
        expect(item.className).toContain('group');
      }
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(TimelineTestHostComponent);
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('renders correctly with a single item', () => {
      const { container } = renderDynamoComponent(
        TimelineSingleItemHostComponent,
      );

      expect(within(container).getAllByRole('listitem')).toHaveLength(1);
    });

    it('does not throw when an item has no projected content', () => {
      expect(() =>
        renderDynamoComponent(TimelineEmptyItemHostComponent),
      ).not.toThrow();
    });
  });

  describe('DynamoTimelineHarness', () => {
    it('reports the item count and per-item content text', async () => {
      const { fixture } = renderDynamoComponent(TimelineTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTimelineHarness,
      );

      expect(await harness.getItemCount()).toBe(3);
      expect(await harness.getItemContentText(0)).toContain('Placed');
      expect(await harness.getItemContentText(2)).toContain('Delivered');
    });

    it('throws when reading a content text at an out-of-range index', async () => {
      const { fixture } = renderDynamoComponent(TimelineTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTimelineHarness,
      );

      await expect(harness.getItemContentText(9)).rejects.toThrow(
        'No item at index 9',
      );
    });
  });
});
