import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoMenuItem } from '@dynamong/menu';
import { OverlayRef } from '@angular/cdk/overlay';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoContextMenu } from './context-menu';
import { DynamoContextMenuHarness } from './context-menu.harness';

// The CDK overlay portals `role="menu"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element —
// same reasoning as DynamoMenu's/DynamoSplitButton's specs.
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
// asserting on the result, same technique as DynamoMenu's/DynamoSplitButton's specs.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-context-menu-test-host',
  standalone: true,
  imports: [DynamoContextMenu, DynamoMenuItem],
  template: `
    <dg-context-menu
      [(open)]="isOpen"
      [disabled]="disabled()"
      (itemSelect)="onSelect($event)"
    >
      <div data-testid="trigger-card">Right-click me</div>
      <dg-menu-item value="edit" label="Edit" />
      <dg-menu-item
        value="delete"
        label="Delete"
        [disabled]="deleteDisabled()"
      />
      <dg-menu-item value="archive" label="Archive" />
    </dg-context-menu>
    <div data-testid="outside">Elsewhere on the page</div>
  `,
})
class ContextMenuTestHostComponent {
  readonly isOpen = model(false);
  readonly disabled = signal(false);
  readonly deleteDisabled = signal(false);
  readonly selected = signal<string | null>(null);

  onSelect(value: string): void {
    this.selected.set(value);
  }
}

@Component({
  selector: 'dg-context-menu-empty-host',
  standalone: true,
  imports: [DynamoContextMenu],
  template: `
    <dg-context-menu>
      <div data-testid="trigger-card">Right-click me</div>
    </dg-context-menu>
  `,
})
class ContextMenuEmptyHostComponent {}

function trigger(container: HTMLElement): HTMLElement {
  return within(container).getByTestId('trigger-card');
}

describe('DynamoContextMenu', () => {
  describe('creation', () => {
    it('renders the projected trigger content', () => {
      const { container } = renderDynamoComponent(ContextMenuTestHostComponent);

      expect(trigger(container)).toBeTruthy();
      expect(trigger(container).textContent).toContain('Right-click me');
    });

    it('does not render a panel before any interaction', () => {
      renderDynamoComponent(ContextMenuTestHostComponent);

      expect(getPanel()).toBeNull();
    });
  });

  describe('contextmenu handling', () => {
    it('opens the panel, focuses the first enabled item, and prevents the native menu', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );

      const event = fireEvent.contextMenu(trigger(container), {
        clientX: 50,
        clientY: 60,
      });
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(document.activeElement).toBe(getItems()[0]);
      expect(event).toBe(false); // fireEvent returns false when preventDefault() was called
    });

    it('does not open and does not prevent the native menu when disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      const event = fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(event).toBe(true); // not prevented
    });

    it('repositions instead of throwing when contextmenu fires again while already open', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container), { clientX: 10, clientY: 10 });
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      expect(() =>
        fireEvent.contextMenu(trigger(container), {
          clientX: 200,
          clientY: 200,
        }),
      ).not.toThrow();
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('actually applies the new position, not just stores it, when contextmenu fires again while already open', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container), { clientX: 10, clientY: 10 });
      await settle(fixture);

      const updatePositionSpy = vi.spyOn(
        OverlayRef.prototype,
        'updatePosition',
      );
      fireEvent.contextMenu(trigger(container), {
        clientX: 200,
        clientY: 200,
      });
      await settle(fixture);

      expect(updatePositionSpy).toHaveBeenCalled();
      updatePositionSpy.mockRestore();
    });

    it('closes when left-clicking inside the trigger while open, matching native context-menu dismissal', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('reopens correctly (reusing the cached overlay handle) after a close/reopen cycle', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);
      await userEvent.click(getItems()[0] as HTMLElement);
      await settle(fixture);
      expect(getPanel()).toBeNull();

      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('item selection', () => {
    it('emits itemSelect and closes when an item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      await userEvent.click(getItems()[0] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBe('edit');
      expect(getPanel()).toBeNull();
    });

    it('does nothing when a disabled item is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      await userEvent.click(getItems()[1] as HTMLElement);
      await settle(fixture);

      expect(componentInstance.selected()).toBeNull();
      expect(getPanel()).not.toBeNull();
    });
  });

  describe('focus restoration', () => {
    it('refocuses whatever was focused before the contextmenu event, after Escape', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      const card = trigger(container);
      card.tabIndex = 0;
      card.focus();
      expect(document.activeElement).toBe(card);

      fireEvent.contextMenu(card);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(card);
    });

    it('does not throw when nothing was focused beforehand', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      (document.activeElement as HTMLElement | null)?.blur();
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      await expect(userEvent.keyboard('{Escape}')).resolves.not.toThrow();
    });
  });

  describe('keyboard navigation', () => {
    it('wraps ArrowDown/ArrowUp and jumps on Home/End within the open panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
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
        ContextMenuTestHostComponent,
      );
      fixture.componentInstance.deleteDisabled.set(true);
      fixture.detectChanges();
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);
      const items = getItems();
      items[0]?.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(items[2]);
    });

    it('closes when clicking outside the trigger and panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(within(container).getByTestId('outside'));
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('does not close when clicking inside the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      fireEvent.click(getPanel() as HTMLElement);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('supports interaction through the DynamoContextMenuHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoContextMenuHarness,
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
      expect(componentInstance.selected()).toBe('archive');

      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('defaults the panel aria-label to "Context menu"', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      expect(getPanel()?.getAttribute('aria-label')).toBe('Context menu');
    });

    it('uses the provided ariaLabel when set', async () => {
      const { fixture } = renderDynamoComponent(DynamoContextMenu, {
        inputs: { ariaLabel: 'Row actions' },
      });

      fireEvent.contextMenu(fixture.nativeElement.querySelector('div'));
      await settle(fixture);

      expect(getPanel()?.getAttribute('aria-label')).toBe('Row actions');
    });

    it('has no axe violations while the panel is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuTestHostComponent,
      );
      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders an empty-but-valid panel without throwing when there are no menu items', async () => {
      const { container, fixture } = renderDynamoComponent(
        ContextMenuEmptyHostComponent,
      );

      fireEvent.contextMenu(trigger(container));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getItems()).toHaveLength(0);
    });
  });
});
