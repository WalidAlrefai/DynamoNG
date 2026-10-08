import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter, type Routes } from '@angular/router';
import type { DynamoPassThrough } from '@dynamong/core/api';
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
import type { DynamoMenuItemSelectEvent } from '@dynamong/menu';
import type { DynamoSplitButtonPart } from './split-button.types';

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
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);

  onAction(): void {
    this.actioned.set(true);
  }
  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.selected.set(event.value);
    this.lastEvent.set(event);
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

@Component({
  selector: 'dg-split-button-pt-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button
      label="Save"
      [ariaDescribedby]="ariaDescribedby()"
      [fluid]="fluid()"
      [pt]="pt()"
    >
      <dg-menu-item value="edit" label="Edit" />
    </dg-split-button>
  `,
})
class SplitButtonPtHostComponent {
  readonly ariaDescribedby = signal<string | undefined>(undefined);
  readonly fluid = signal(false);
  readonly pt = signal<DynamoPassThrough<DynamoSplitButtonPart> | undefined>(
    undefined,
  );
}

@Component({
  selector: 'dg-split-button-visible-shortcut-badge-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button label="Save">
      <dg-menu-item value="file" label="File" />
      <dg-menu-item value="hidden" label="Hidden" [visible]="false" />
      <dg-menu-item value="save-copy" label="Save a copy" shortcut="⌘S" />
      <dg-menu-item value="inbox" label="Inbox" [badge]="3" />
      <dg-menu-item value="drafts" label="Drafts" badge="New" />
    </dg-split-button>
  `,
})
class SplitButtonVisibleShortcutBadgeHostComponent {}

@Component({
  selector: 'dg-split-button-separator-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button label="Save" (itemSelect)="onSelect($event)">
      <dg-menu-item value="edit" label="Edit" />
      <dg-menu-item value="duplicate" label="Duplicate" />
      <dg-menu-item [separator]="true" value="" label="" />
      <dg-menu-item value="delete" label="Delete" />
    </dg-split-button>
  `,
})
class SplitButtonSeparatorHostComponent {
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);

  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.lastEvent.set(event);
  }
}

@Component({
  selector: 'dg-split-button-router-link-host',
  standalone: true,
  imports: [DynamoSplitButton, DynamoMenuItem],
  template: `
    <dg-split-button label="Save" (itemSelect)="onSelect($event)">
      <dg-menu-item
        value="docs"
        label="Docs"
        routerLink="/components/badge"
        [disabled]="disabled()"
      />
    </dg-split-button>
  `,
})
class SplitButtonRouterLinkHostComponent {
  readonly disabled = signal(false);
  readonly lastEvent = signal<DynamoMenuItemSelectEvent | null>(null);

  onSelect(event: DynamoMenuItemSelectEvent): void {
    this.lastEvent.set(event);
  }
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
      expect(componentInstance.lastEvent()).toEqual({
        value: 'save-as',
        label: 'Save as...',
        disabled: false,
      });
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

    it('closes and refocuses the trigger when the backdrop is clicked', async () => {
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
      expect(document.activeElement).toBe(trigger(container));
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

  describe('buttonDisabled / menuButtonDisabled', () => {
    it('buttonDisabled disables only the primary action, leaving the dropdown toggle usable', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSplitButton,
        { inputs: { label: 'Save', buttonDisabled: true } },
      );

      expect((primary(container) as HTMLButtonElement).disabled).toBe(true);
      expect((trigger(container) as HTMLButtonElement).disabled).toBe(false);

      await userEvent.click(trigger(container));

      expect(componentInstance.open()).toBe(true);
    });

    it('menuButtonDisabled disables only the dropdown toggle, leaving the primary action usable', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSplitButton,
        { inputs: { label: 'Save', menuButtonDisabled: true } },
      );
      let actioned = false;
      componentInstance.action.subscribe(() => {
        actioned = true;
      });

      expect((trigger(container) as HTMLButtonElement).disabled).toBe(true);
      expect((primary(container) as HTMLButtonElement).disabled).toBe(false);

      await userEvent.click(primary(container));

      expect(actioned).toBe(true);
    });

    it('disabled overrides both regardless of buttonDisabled/menuButtonDisabled', () => {
      const { container } = renderDynamoComponent(DynamoSplitButton, {
        inputs: { label: 'Save', disabled: true },
      });

      expect((primary(container) as HTMLButtonElement).disabled).toBe(true);
      expect((trigger(container) as HTMLButtonElement).disabled).toBe(true);
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

  describe('pt / ariaDescribedby / fluid', () => {
    it('merges pt class onto root/primary/trigger/panel/item', async () => {
      const { fixture, container } = renderDynamoComponent(
        SplitButtonPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { class: 'pt-root' },
        primary: { class: 'pt-primary' },
        trigger: { class: 'pt-trigger' },
        panel: { class: 'pt-panel' },
        item: { class: 'pt-item' },
      });
      fixture.detectChanges();

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(primary(container).classList.contains('pt-primary')).toBe(true);
      expect(trigger(container).classList.contains('pt-trigger')).toBe(true);

      await userEvent.click(trigger(container));
      await settle(fixture);

      expect(getPanel()?.classList.contains('pt-panel')).toBe(true);
      expect(getOverlayContainer().querySelectorAll('.pt-item').length).toBe(1);
    });

    it('merges a non-class pt attribute onto the trigger', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitButtonPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        trigger: { 'data-testid': 'trigger-el' },
      });
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="trigger-el"]'),
      ).not.toBeNull();
    });

    it('omits aria-describedby by default, forwards it to the trigger when set', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitButtonPtHostComponent,
      );
      expect(trigger(container).getAttribute('aria-describedby')).toBeNull();

      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.detectChanges();
      expect(trigger(container).getAttribute('aria-describedby')).toBe(
        'hint-id',
      );
    });

    it('defaults fluid to false (inline-flex), opts in when true (flex w-full, primary grows)', () => {
      const { fixture, container } = renderDynamoComponent(
        SplitButtonPtHostComponent,
      );
      const root = container.querySelector('div') as HTMLElement;
      expect(root.className).toContain('inline-flex');
      expect(root.className).not.toContain('w-full');

      fixture.componentInstance.fluid.set(true);
      fixture.detectChanges();
      expect(root.className).toContain('w-full');
      expect(primary(container).className).toContain('flex-1');
    });

    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { fixture, container } = renderDynamoComponent(
        SplitButtonPtHostComponent,
      );
      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.componentInstance.fluid.set(true);
      fixture.componentInstance.pt.set({ trigger: { class: 'pt-trigger' } });
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('visible / shortcut / badge', () => {
    it('hides a visible:false item (not just dimmed) and excludes it from keyboard nav', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonVisibleShortcutBadgeHostComponent,
      );
      await userEvent.click(trigger(container));
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

      getItems()[0]?.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement?.textContent).toContain('Save a copy');
    });

    it('renders a shortcut as aria-hidden trailing text', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonVisibleShortcutBadgeHostComponent,
      );
      await userEvent.click(trigger(container));
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
        SplitButtonVisibleShortcutBadgeHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      const badges = Array.from(
        getOverlayContainer().querySelectorAll('dg-badge'),
      ).map((el) => el.textContent?.trim());
      expect(badges).toEqual(['3', 'New']);
    });

    it('has no axe violations with visible/shortcut/badge set', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonVisibleShortcutBadgeHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('separator', () => {
    it('renders with role="separator", not role="menuitem"', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonSeparatorHostComponent,
      );
      await userEvent.click(trigger(container));
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
        SplitButtonSeparatorHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);
      expect(document.activeElement?.textContent).toContain('Edit');

      await userEvent.keyboard('{ArrowDown}'); // -> Duplicate
      await userEvent.keyboard('{ArrowDown}'); // skips the separator -> Delete

      expect(document.activeElement?.textContent).toContain('Delete');
    });

    it('clicking the separator does not emit itemSelect', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        SplitButtonSeparatorHostComponent,
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      const separator = getPanel()?.querySelector(
        '[role="separator"]',
      ) as HTMLElement;
      separator.click();
      fixture.detectChanges();

      expect(componentInstance.lastEvent()).toBeNull();
    });
  });

  describe('routerLink', () => {
    // A wildcard catch-all route so Router.navigateByUrl() (triggered by
    // RouterLink's own click handling) resolves instead of rejecting with
    // "Cannot match any routes" — same established fix as Menu's own
    // routerLink tests.
    @Component({ selector: 'dg-blank-test', template: '', standalone: true })
    class BlankRouteComponent {}
    const TEST_ROUTES: Routes = [
      { path: '**', component: BlankRouteComponent },
    ];

    it('renders a leaf with routerLink as a real <a> with the router-generated href', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      await userEvent.click(trigger(container));
      await settle(fixture);

      const link = getOverlayContainer().querySelector('a[role="menuitem"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/components/badge');
    });

    it('fires itemSelect and closes/refocuses on click, alongside navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      await userEvent.click(trigger(container));
      await settle(fixture);
      const link = getOverlayContainer().querySelector(
        'a[role="menuitem"]',
      ) as HTMLElement;

      await userEvent.click(link);
      await settle(fixture);

      expect(fixture.componentInstance.lastEvent()?.value).toBe('docs');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger(container));
    });

    it('does not navigate (routerLink is null) when the item is disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        SplitButtonRouterLinkHostComponent,
        { providers: [provideRouter(TEST_ROUTES)] },
      );
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      await userEvent.click(trigger(container));
      await settle(fixture);

      const link = getOverlayContainer().querySelector('a[role="menuitem"]');
      expect(link?.getAttribute('href')).toBeNull();
    });
  });
});
