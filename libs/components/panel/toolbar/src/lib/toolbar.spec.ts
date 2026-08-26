import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoToolbar } from './toolbar';
import { DynamoToolbarHarness } from './toolbar.harness';

@Component({
  selector: 'dg-toolbar-test-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar ariaLabel="Document actions">
      <span start>Title</span>
      <span center>Search</span>
      <button end type="button">Save</button>
    </dg-toolbar>
  `,
})
class ToolbarTestHostComponent {}

@Component({
  selector: 'dg-toolbar-start-only-host',
  standalone: true,
  imports: [DynamoToolbar],
  template: `
    <dg-toolbar>
      <span start>Title</span>
    </dg-toolbar>
  `,
})
class ToolbarStartOnlyHostComponent {}

describe('DynamoToolbar', () => {
  describe('creation', () => {
    it('renders a role="toolbar" element with start/center/end slots', () => {
      const { container } = renderDynamoComponent(DynamoToolbar);

      expect(within(container).getByRole('toolbar')).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-start"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-center"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoToolbar-end"]'),
      ).toBeTruthy();
    });
  });

  describe('content projection', () => {
    it('projects content with [start]/[center]/[end] attributes into the matching slot', () => {
      const { container } = renderDynamoComponent(ToolbarTestHostComponent);

      const start = container.querySelector(
        '[data-testid="DynamoToolbar-start"]',
      );
      const center = container.querySelector(
        '[data-testid="DynamoToolbar-center"]',
      );
      const end = container.querySelector('[data-testid="DynamoToolbar-end"]');
      expect(start?.textContent?.trim()).toBe('Title');
      expect(center?.textContent?.trim()).toBe('Search');
      expect(end?.textContent?.trim()).toBe('Save');
    });

    it('renders an empty slot with no stray content when nothing is projected into it', () => {
      const { container } = renderDynamoComponent(
        ToolbarStartOnlyHostComponent,
      );

      const center = container.querySelector(
        '[data-testid="DynamoToolbar-center"]',
      );
      expect(center?.textContent?.trim()).toBe('');
    });
  });

  describe('input properties', () => {
    it('falls back aria-label to null when unset', () => {
      const { container } = renderDynamoComponent(DynamoToolbar);

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-label'),
      ).toBeNull();
    });

    it('reflects the provided ariaLabel', () => {
      const { container } = renderDynamoComponent(DynamoToolbar, {
        inputs: { ariaLabel: 'Document actions' },
      });

      expect(
        within(container).getByRole('toolbar').getAttribute('aria-label'),
      ).toBe('Document actions');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(ToolbarTestHostComponent);
      await expectNoA11yViolations(container);
    });
  });

  describe('DynamoToolbarHarness', () => {
    it('reads text from each named slot', async () => {
      const { fixture } = renderDynamoComponent(ToolbarTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoToolbarHarness,
      );

      expect(await harness.getSlotText('start')).toBe('Title');
      expect(await harness.getSlotText('center')).toBe('Search');
      expect(await harness.getSlotText('end')).toBe('Save');
    });
  });
});
