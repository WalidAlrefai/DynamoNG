import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoMenu } from './menu';
import { DynamoMenuItem } from './menu-item';
import { DynamoMenuHarness } from './menu.harness';

// The CDK overlay portals `role="menu"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element —
// same reasoning as DynamoTooltip's spec.
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
// asserting on the result, same technique as DynamoTooltip's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-menu-test-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions" [(open)]="isOpen" (itemSelect)="onSelect($event)">
      <dg-menu-item value="edit" label="Edit" />
      <dg-menu-item
        value="delete"
        label="Delete"
        [disabled]="deleteDisabled()"
      />
      <dg-menu-item value="archive" label="Archive" />
    </dg-menu>
  `,
})
class MenuTestHostComponent {
  readonly isOpen = model(false);
  readonly deleteDisabled = signal(false);
  readonly selected = signal<string | null>(null);

  onSelect(value: string): void {
    this.selected.set(value);
  }
}

@Component({
  selector: 'dg-menu-single-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions">
      <dg-menu-item value="only" label="Only" />
    </dg-menu>
  `,
})
class MenuSingleHostComponent {}

@Component({
  selector: 'dg-menu-all-disabled-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions">
      <dg-menu-item value="a" label="A" [disabled]="true" />
      <dg-menu-item value="b" label="B" [disabled]="true" />
    </dg-menu>
  `,
})
class MenuAllDisabledHostComponent {}

@Component({
  selector: 'dg-menu-dynamic-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions">
      @for (item of items(); track item.value) {
        <dg-menu-item [value]="item.value" [label]="item.label" />
      }
    </dg-menu>
  `,
})
class MenuDynamicHostComponent {
  readonly items = signal([
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]);
}

describe('DynamoMenu', () => {
  describe('creation', () => {
    it('renders the trigger button with the label text', () => {
      const { container } = renderDynamoComponent(MenuTestHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Actions' }),
      ).toBeTruthy();
    });

    it('does not render a menu panel before any interaction', () => {
      renderDynamoComponent(MenuTestHostComponent);

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed and position "bottom-start"', () => {
      const { componentInstance } = renderDynamoComponent(DynamoMenu, {
        inputs: { label: 'Actions' },
      });

      expect(componentInstance.open()).toBe(false);
      expect(componentInstance.position()).toBe('bottom-start');
    });
  });

  describe('user interactions', () => {
    it('opens the menu and focuses the first enabled item when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(document.activeElement).toBe(getItems()[0]);
    });

    it('emits itemSelect, closes, and refocuses the trigger when an item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getItems()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBe('edit');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('does nothing when a disabled item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(getItems()[1] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBeNull();
      expect(getPanel()).not.toBeNull();
    });

    it('closes and refocuses the trigger on Escape', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('opens and focuses the first enabled item when ArrowDown is pressed on the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(document.activeElement).toBe(getItems()[0]);
    });

    it('opens and focuses the last enabled item when ArrowUp is pressed on the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      trigger.focus();

      await userEvent.keyboard('{ArrowUp}');
      await settle(fixture);

      const items = getItems();
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('wraps ArrowDown from the last item to the first', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      const items = getItems();
      items[items.length - 1]?.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(items[0]);
    });

    it('wraps ArrowUp from the first item to the last', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      const items = getItems();
      items[0]?.focus();

      await userEvent.keyboard('{ArrowUp}');

      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('jumps to the first/last item on Home/End', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      const items = getItems();
      items[0]?.focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(items[items.length - 1]);

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(items[0]);
    });

    it('skips disabled items during Arrow navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      const items = getItems();
      items[0]?.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(items[2]);
    });

    it('selects and closes on Enter for a focused item', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.selected()).toBe('edit');
      expect(getPanel()).toBeNull();
    });

    it('supports interaction through the DynamoMenuHarness', async () => {
      const { fixture } = renderDynamoComponent(MenuTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMenuHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getItemLabels()).toEqual([
        'Edit',
        'Delete',
        'Archive',
      ]);

      await harness.selectItemByLabel('Archive');
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('conditional rendering', () => {
    it('only mounts the panel element while open', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });

      expect(getPanel()).toBeNull();
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('reflects aria-expanded and aria-controls on the trigger based on open state', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(trigger.getAttribute('aria-controls')).toBe(getPanel()?.id);
    });

    it('labels the panel via aria-labelledby pointing at the trigger by default', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.getAttribute('aria-labelledby')).toBe(trigger.id);
      expect(getPanel()?.getAttribute('aria-label')).toBeNull();
    });

    it('has no axe violations while the menu is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('opens when the open model is set programmatically', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        MenuTestHostComponent,
      );

      componentInstance.isOpen.set(true);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('opens and focuses the single item without throwing', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuSingleHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(document.activeElement).toBe(getItems()[0]);
    });

    it('does not throw when every item is disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuAllDisabledHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('reflects dynamically added and removed items', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuDynamicHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getItems()).toHaveLength(2);

      fixture.componentInstance.items.set([{ value: 'a', label: 'A' }]);
      fixture.detectChanges();

      expect(getItems()).toHaveLength(1);
    });
  });
});
