import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoMenuItem } from '@dynamong/menu';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoSplitButton } from './split-button';
import { DynamoSplitButtonHarness } from './split-button.harness';

// The CDK overlay portals `role="menu"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element —
// same reasoning as DynamoMenu's spec.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="menu"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getItems(): HTMLElement[] {
  return Array.from(getPanel()?.querySelectorAll('[role="menuitem"]') ?? []);
}

// The open()-driven overlay attach/detach effect runs via Angular's zoneless
// effect scheduler, not synchronously with the signal write that triggered
// it — flushing a real setTimeout(0) plus detectChanges() is needed before
// asserting on the result, same technique as DynamoMenu's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-split-button-test-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button
      label="Save"
      [(open)]="isOpen"
      [disabled]="disabled()"
      (action)="onAction()"
      (itemSelect)="onSelect($event)"
    >
      <dg-menu-item value="save-as" label="Save as..." />
      <dg-menu-item
        value="delete"
        label="Delete"
        [disabled]="deleteDisabled()"
      />
      <dg-menu-item value="duplicate" label="Duplicate" />
    </dg-split-button>
  `,
})
class SplitButtonTestHostComponent {
  readonly isOpen = model(false);
  readonly disabled = signal(false);
  readonly deleteDisabled = signal(false);
  readonly actioned = signal(false);
  readonly selected = signal<string | null>(null);

  onAction(): void {
    this.actioned.set(true);
  }
  onSelect(value: string): void {
    this.selected.set(value);
  }
}

@Component({
  selector: 'dg-split-button-empty-host',
  standalone: true,
  imports: [DynamoSplitButton],
  template: `<dg-split-button label="Save" />`,
})
class SplitButtonEmptyHostComponent {}

@Component({
  selector: 'dg-split-button-all-disabled-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button label="Save">
      <dg-menu-item value="a" label="A" [disabled]="true" />
      <dg-menu-item value="b" label="B" [disabled]="true" />
    </dg-split-button>
  `,
})
class SplitButtonAllDisabledHostComponent {}

function trigger(container: HTMLElement): HTMLElement {
  return within(container).getByRole('button', { name: 'More actions' });
}
function primary(container: HTMLElement): HTMLElement {
  return within(container).getByRole('button', { name: 'Save' });
}

describe('DynamoSplitButton', () => {
  describe('creation', () => {
    it('renders the primary button and the trigger', () => {
      const { container } = renderDynamoComponent(SplitButtonTestHostComponent);

      expect(primary(container)).toBeTruthy();
      expect(trigger(container)).toBeTruthy();
    });

    it('does not render a panel before any interaction', () => {
      renderDynamoComponent(SplitButtonTestHostComponent);

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed and position "bottom-start"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoSplitButton, {
        inputs: { label: 'Save' },
      });

      expect(componentInstance.open()).toBe(false);
      expect(componentInstance.position()).toBe('bottom-start');
      expect(componentInstance.severity()).toBe('primary');
      expect(componentInstance.variant()).toBe('solid');
      expect(componentInstance.size()).toBe('md');
    });
  });

  describe('primary action', () => {
    it('emits action on click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );

      await userEvent.click(primary(container));

      expect(componentInstance.actioned()).toBe(true);
    });

    it('ignores the primary click when disabled', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      await userEvent.click(primary(container));

      expect(componentInstance.actioned()).toBe(false);
    });
  });

  describe('trigger interaction', () => {
    it('opens the panel and focuses the first enabled item when clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(document.activeElement).toBe(getItems()[0]);
    });

    it('emits itemSelect, closes, and refocuses the trigger when an item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      await userEvent.click(getItems()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBe('save-as');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger(container));
    });

    it('does nothing when a disabled item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      await userEvent.click(trigger(container));
      await settle(fixture);

      await userEvent.click(getItems()[1] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBeNull();
      expect(getPanel()).not.toBeNull();
    });

    it('closes and refocuses the trigger on Escape', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger(container));
    });

    it('ignores clicks and keydowns on the trigger when disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('opens and focuses the first enabled item on ArrowDown', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      trigger(container).focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(document.activeElement).toBe(getItems()[0]);
    });

    it('opens and focuses the last enabled item on ArrowUp', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      trigger(container).focus();

      await userEvent.keyboard('{ArrowUp}');
      await settle(fixture);

      const items = getItems();
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('wraps ArrowDown/ArrowUp and jumps on Home/End within the open panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);
      const items = getItems();
      items[items.length - 1]?.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(items[0]);

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(items[items.length - 1]);

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(items[0]);
    });

    it('skips disabled items during Arrow navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      await userEvent.click(trigger(container));
      await settle(fixture);
      const items = getItems();
      items[0]?.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(items[2]);
    });

    it('supports interaction through the DynamoSplitButtonHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSplitButtonHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.clickPrimary();
      expect(componentInstance.actioned()).toBe(true);

      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getItemLabels()).toEqual([
        'Save as...',
        'Delete',
        'Duplicate',
      ]);

      await harness.selectItemByLabel('Duplicate');
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
      expect(componentInstance.selected()).toBe('duplicate');

      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('sets aria-haspopup and reflects aria-expanded on the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      const triggerEl = trigger(container);
      expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
      expect(triggerEl.getAttribute('aria-expanded')).toBe('false');

      await userEvent.click(triggerEl);
      await settle(fixture);

      expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
    });

    it('has no axe violations while the panel is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonTestHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders an empty-but-valid panel without throwing when there are no menu items', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonEmptyHostComponent,
      );

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getItems()).toHaveLength(0);
    });

    it('does not throw pressing Home in an open panel with no items', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonEmptyHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      getPanel()?.focus();
      await expect(userEvent.keyboard('{Home}')).resolves.not.toThrow();
    });

    it('does not throw when every item is disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonAllDisabledHostComponent,
      );

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });
});
