import { Component, model, signal } from '@angular/core';
import type { DynamoPassThrough } from '@dynamong/core/api';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter, type Routes } from '@angular/router';
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
import type { DynamoMenuItemSelectEvent, DynamoMenuPart } from './menu.types';

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
    <dg-menu
      label="Actions"
      [(open)]="isOpen"
      [ariaDescribedby]="ariaDescribedby()"
      [fluid]="fluid()"
      [pt]="pt()"
      (itemSelect)="onSelect($event)"
    >
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
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);
  readonly ariaDescribedby = signal<string | undefined>(undefined);
  readonly fluid = signal(false);
  readonly pt = signal<DynamoPassThrough<DynamoMenuPart> | undefined>(
    undefined,
  );

  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.selected.set(event.value);
    this.lastEvent.set(event);
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
  selector: 'dg-menu-icon-separator-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions" (itemSelect)="onSelect($event)">
      <dg-menu-item value="edit" label="Edit" icon="✎" />
      <dg-menu-item value="duplicate" label="Duplicate" />
      <dg-menu-item [separator]="true" value="" label="" />
      <dg-menu-item value="delete" label="Delete" icon="🗑" />
    </dg-menu>
  `,
})
class MenuIconSeparatorHostComponent {
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);

  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.lastEvent.set(event);
  }
}

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

@Component({
  selector: 'dg-menu-visible-shortcut-badge-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions">
      <dg-menu-item value="file" label="File" />
      <dg-menu-item value="hidden" label="Hidden" [visible]="false" />
      <dg-menu-item value="save" label="Save" shortcut="⌘S" />
      <dg-menu-item value="inbox" label="Inbox" [badge]="3" />
      <dg-menu-item value="drafts" label="Drafts" badge="New" />
    </dg-menu>
  `,
})
class MenuVisibleShortcutBadgeHostComponent {}

@Component({
  selector: 'dg-menu-item-template-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions">
      <ng-template #itemTemplate let-item>
        <span data-testid="custom-item">{{ item.label() }} (custom)</span>
      </ng-template>
      <dg-menu-item value="edit" label="Edit" />
      <dg-menu-item value="duplicate" label="Duplicate" />
    </dg-menu>
  `,
})
class MenuItemTemplateHostComponent {}

@Component({
  selector: 'dg-menu-router-link-host',
  standalone: true,
  imports: [DynamoMenu, DynamoMenuItem],
  template: `
    <dg-menu label="Actions" (itemSelect)="onSelect($event)">
      <dg-menu-item
        value="docs"
        label="Docs"
        routerLink="/components/badge"
        [disabled]="disabled()"
      />
    </dg-menu>
  `,
})
class MenuRouterLinkHostComponent {
  readonly disabled = signal(false);
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);

  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.lastEvent.set(event);
  }
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
      expect(componentInstance.lastEvent()).toEqual({
        value: 'edit',
        label: 'Edit',
        disabled: false,
      });
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

    it('closes and refocuses the trigger when the backdrop is clicked', async () => {
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
      expect(document.activeElement).toBe(trigger);
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

  describe('pt / ariaDescribedby / fluid', () => {
    it('merges pt class onto root/trigger', () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { class: 'pt-root' },
        trigger: { class: 'pt-trigger' },
      });
      fixture.detectChanges();

      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      expect(trigger.classList.contains('pt-root')).toBe(true);
      expect(trigger.classList.contains('pt-trigger')).toBe(true);
    });

    it('merges a non-class pt attribute onto the trigger', () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.pt.set({
        trigger: { 'data-testid': 'trigger-el' },
      });
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="trigger-el"]'),
      ).not.toBeNull();
    });

    it('merges pt class onto panel/item once open', async () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.pt.set({
        panel: { class: 'pt-panel' },
        item: { class: 'pt-item' },
      });
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.classList.contains('pt-panel')).toBe(true);
      expect(getOverlayContainer().querySelectorAll('.pt-item').length).toBe(3);
    });

    it('omits aria-describedby by default, forwards it to the trigger when set', () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      expect(trigger.getAttribute('aria-describedby')).toBeNull();

      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe('hint-id');
    });

    it('defaults fluid to false (no w-full), opts in when true', () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      expect(trigger.className).not.toContain('w-full');

      fixture.componentInstance.fluid.set(true);
      fixture.detectChanges();
      expect(trigger.className).toContain('w-full');
    });

    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { fixture, container } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.componentInstance.fluid.set(true);
      fixture.componentInstance.pt.set({ trigger: { class: 'pt-trigger' } });
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
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

  describe('icon and separator', () => {
    it('renders an item icon in an aria-hidden span before the label', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const edit = getItems().find((el) => el.textContent?.includes('Edit'));
      const iconSpan = edit?.querySelector('span[aria-hidden="true"]');
      expect(iconSpan?.textContent).toBe('✎');
    });

    it('renders a separator with role="separator", not role="menuitem"', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.querySelectorAll('[role="separator"]')).toHaveLength(
        1,
      );
      // 3 real commands (Edit, Duplicate, Delete) — the separator is not
      // counted among role="menuitem" rows.
      expect(getItems()).toHaveLength(3);
    });

    it('keyboard navigation skips the separator', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      // Focus starts on "Edit" (first enabled item).
      expect(document.activeElement?.textContent).toContain('Edit');

      await userEvent.keyboard('{ArrowDown}'); // -> Duplicate
      await userEvent.keyboard('{ArrowDown}'); // skips the separator -> Delete

      expect(document.activeElement?.textContent).toContain('Delete');
    });

    it('clicking the separator does not emit itemSelect', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const separator = getPanel()?.querySelector(
        '[role="separator"]',
      ) as HTMLElement;
      separator.click();
      fixture.detectChanges();

      expect(componentInstance.lastEvent()).toBeNull();
    });

    it('itemSelect includes the icon when set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const edit = getItems().find((el) => el.textContent?.includes('Edit'));
      edit?.click();
      fixture.detectChanges();

      expect(componentInstance.lastEvent()).toEqual({
        value: 'edit',
        label: 'Edit',
        disabled: false,
        icon: '✎',
      });
    });

    it('itemSelect omits the icon key when unset', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const duplicate = getItems().find((el) =>
        el.textContent?.includes('Duplicate'),
      );
      duplicate?.click();
      fixture.detectChanges();

      expect(componentInstance.lastEvent()).toEqual({
        value: 'duplicate',
        label: 'Duplicate',
        disabled: false,
      });
    });

    it('has no axe violations with an icon and a separator present', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuIconSeparatorHostComponent,
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

  describe('visible / shortcut / badge', () => {
    it('hides a visible:false item (not just dimmed) and excludes it from keyboard nav', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuVisibleShortcutBadgeHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      // [hidden] (not full DOM omission) keeps items()/itemButtons()
      // positionally aligned — see findEnabledIndex's own doc comment —
      // so the element is still queryable, just hidden/unfocusable/
      // announced-as-absent, not gone from the DOM entirely.
      const hidden = getItems().find(
        (el) => el.textContent?.trim() === 'Hidden',
      ) as HTMLElement;
      expect(hidden.hidden).toBe(true);
      expect(hidden.getAttribute('aria-hidden')).toBe('true');

      // ArrowDown from the first item ("File") should skip "Hidden" and
      // land on "Save".
      getItems()[0]?.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement?.textContent).toContain('Save');
    });

    it('renders a shortcut as aria-hidden trailing text', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuVisibleShortcutBadgeHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const shortcutEl = Array.from(
        getOverlayContainer().querySelectorAll('span'),
      ).find(
        (el) => el.textContent?.trim() === '⌘S' && el.children.length === 0,
      );
      expect(shortcutEl).toBeTruthy();
      expect(shortcutEl?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders a badge via dg-badge for both string and number values', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuVisibleShortcutBadgeHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const badges = Array.from(
        getOverlayContainer().querySelectorAll('dg-badge'),
      ).map((el) => el.textContent?.trim());
      expect(badges).toEqual(['3', 'New']);
    });

    it('has no axe violations with visible/shortcut/badge set', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuVisibleShortcutBadgeHostComponent,
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

  describe('custom item template', () => {
    it('renders the custom template in place of the plain label', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuItemTemplateHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const customItems = within(getOverlayContainer()).getAllByTestId(
        'custom-item',
      );
      expect(customItems.map((el) => el.textContent?.trim())).toEqual([
        'Edit (custom)',
        'Duplicate (custom)',
      ]);
    });

    it('falls back to the plain label when no template is projected', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(
        within(getOverlayContainer()).queryAllByTestId('custom-item'),
      ).toHaveLength(0);
      expect(getItems().map((el) => el.textContent?.trim())).toEqual([
        'Edit',
        'Delete',
        'Archive',
      ]);
    });
  });

  describe('routerLink', () => {
    // A wildcard catch-all route so Router.navigateByUrl() (triggered by
    // RouterLink's own click handling) resolves instead of rejecting with
    // "Cannot match any routes" — same established fix as Menubar's own
    // routerLink tests.
    @Component({ selector: 'dg-blank-test', template: '', standalone: true })
    class BlankRouteComponent {}
    const TEST_ROUTES: Routes = [
      { path: '**', component: BlankRouteComponent },
    ];

    it('renders a leaf with routerLink as a real <a> with the router-generated href', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const link = getOverlayContainer().querySelector('a[role="menuitem"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/components/badge');
    });

    it('fires itemSelect and closes/refocuses on click, alongside navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      const link = getOverlayContainer().querySelector(
        'a[role="menuitem"]',
      ) as HTMLElement;

      await userEvent.click(link);
      await settle(fixture);

      expect(fixture.componentInstance.lastEvent()?.value).toBe('docs');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('renders a disabled routerLink item with no href (inert)', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const link = getOverlayContainer().querySelector('a[role="menuitem"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBeNull();
    });

    it('an item with no routerLink is unaffected, still a plain button', async () => {
      const { container, fixture } = renderDynamoComponent(
        MenuTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Actions',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getItems()[0]?.tagName).toBe('BUTTON');
    });
  });
});
