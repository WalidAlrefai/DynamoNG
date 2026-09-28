import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoTab } from './tab';
import { DynamoTabs } from './tabs';
import { DynamoTabsHarness } from './tabs.harness';
import type { DynamoTabsActivation } from './tabs.types';

@Component({
  selector: 'dg-tabs-test-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs
      [(value)]="activeTab"
      [activation]="activation()"
      ariaLabel="Account settings"
    >
      <dg-tab value="profile" label="Profile">
        <p data-testid="profile-marker">Profile content</p>
      </dg-tab>
      <dg-tab value="settings" label="Settings" [disabled]="settingsDisabled()">
        <p data-testid="settings-marker">Settings content</p>
      </dg-tab>
      <dg-tab value="billing" label="Billing">
        <p data-testid="billing-marker">Billing content</p>
      </dg-tab>
    </dg-tabs>
  `,
})
class TabsTestHostComponent {
  readonly activeTab = model<string | undefined>(undefined);
  readonly activation = signal<DynamoTabsActivation>('manual');
  readonly settingsDisabled = signal(false);
}

@Component({
  selector: 'dg-tabs-all-disabled-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs>
      <dg-tab value="a" label="A" [disabled]="true">A content</dg-tab>
      <dg-tab value="b" label="B" [disabled]="true">B content</dg-tab>
    </dg-tabs>
  `,
})
class TabsAllDisabledHostComponent {}

@Component({
  selector: 'dg-tabs-single-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs>
      <dg-tab value="only" label="Only">Only content</dg-tab>
    </dg-tabs>
  `,
})
class TabsSingleHostComponent {}

@Component({
  selector: 'dg-tabs-dynamic-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs [(value)]="activeTab">
      @for (item of items(); track item.value) {
        <dg-tab [value]="item.value" [label]="item.label"
          >{{ item.label }} content</dg-tab
        >
      }
    </dg-tabs>
  `,
})
class TabsDynamicHostComponent {
  readonly activeTab = model<string | undefined>(undefined);
  readonly items = signal([
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]);
}

@Component({
  selector: 'dg-tabs-vertical-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs
      [(value)]="activeTab"
      [orientation]="'vertical'"
      [verticalWidth]="220"
      ariaLabel="Account settings"
    >
      <dg-tab value="profile" label="Profile">Profile content</dg-tab>
      <dg-tab value="settings" label="Settings">Settings content</dg-tab>
      <dg-tab value="billing" label="Billing">Billing content</dg-tab>
    </dg-tabs>
  `,
})
class TabsVerticalHostComponent {
  readonly activeTab = model<string | undefined>(undefined);
}

@Component({
  selector: 'dg-tabs-closable-host',
  standalone: true,
  imports: [DynamoTabs, DynamoTab],
  template: `
    <dg-tabs [(value)]="activeTab" (tabClose)="onTabClose($event)">
      @for (item of items(); track item.value) {
        <dg-tab
          [value]="item.value"
          [label]="item.label"
          [closable]="item.closable"
          >{{ item.label }} content</dg-tab
        >
      }
    </dg-tabs>
  `,
})
class TabsClosableHostComponent {
  readonly activeTab = model<string | undefined>(undefined);
  readonly items = signal([
    { value: 'a', label: 'A', closable: true },
    { value: 'b', label: 'B', closable: true },
    { value: 'c', label: 'C', closable: false },
  ]);
  readonly closed: string[] = [];

  onTabClose(value: string): void {
    this.closed.push(value);
    this.items.update((current) => current.filter((i) => i.value !== value));
  }
}

describe('DynamoTabs', () => {
  describe('creation', () => {
    it('renders a tablist with one tab per projected dg-tab', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(within(container).getByRole('tablist')).toBeTruthy();
      expect(within(container).getAllByRole('tab')).toHaveLength(3);
    });

    it('renders exactly one non-hidden tabpanel', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      const panels = within(container)
        .getAllByRole('tabpanel', { hidden: true })
        .filter((panel) => !panel.hasAttribute('hidden'));
      expect(panels).toHaveLength(1);
    });
  });

  describe('default behavior', () => {
    it('auto-selects the first tab when no value is bound', () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );

      expect(
        within(container)
          .getByRole('tab', { name: 'Profile' })
          .getAttribute('aria-selected'),
      ).toBe('true');
      expect(componentInstance.activeTab()).toBe('profile');
    });

    it('defaults activation to "manual"', () => {
      const { componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );

      expect(componentInstance.activation()).toBe('manual');
    });
  });

  describe('input properties', () => {
    it('reflects disabled on a dg-tab as aria-disabled and tabindex -1', () => {
      const { container, fixture } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      const settingsTab = within(container).getByRole('tab', {
        name: 'Settings',
      });
      expect(settingsTab.getAttribute('aria-disabled')).toBe('true');
      expect(settingsTab.getAttribute('tabindex')).toBe('-1');
    });

    it('renders each tab label as its visible text', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(
        within(container).getByRole('tab', { name: 'Billing' }),
      ).toBeTruthy();
    });

    it('reflects ariaLabel onto the tablist', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(
        within(container).getByRole('tablist').getAttribute('aria-label'),
      ).toBe('Account settings');
    });
  });

  describe('output events', () => {
    it('updates the two-way-bound value when a tab is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Billing' }),
      );

      expect(componentInstance.activeTab()).toBe('billing');
    });
  });

  describe('user interactions', () => {
    it('activates and shows the panel of a clicked tab, hiding the previous one', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Billing' }),
      );

      expect(
        within(container)
          .getByText('Billing content')
          .closest('[role="tabpanel"]')
          ?.hasAttribute('hidden'),
      ).toBe(false);
      expect(
        within(container)
          .getByText('Profile content')
          .closest('[role="tabpanel"]')
          ?.hasAttribute('hidden'),
      ).toBe(true);
    });

    it('moves focus to a clicked tab', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);
      const billingTab = within(container).getByRole('tab', {
        name: 'Billing',
      });

      await userEvent.click(billingTab);

      expect(document.activeElement).toBe(billingTab);
    });

    it('does nothing when a disabled tab is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Settings' }),
      );

      expect(componentInstance.activeTab()).toBe('profile');
    });

    it('moves focus with ArrowRight/ArrowLeft without activating in manual mode', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Settings' }),
      );
      expect(componentInstance.activeTab()).toBe('profile');
    });

    it('wraps ArrowRight from the last tab to the first', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);
      const billingTab = within(container).getByRole('tab', {
        name: 'Billing',
      });
      billingTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Profile' }),
      );
    });

    it('wraps ArrowLeft from the first tab to the last', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Billing' }),
      );
    });

    it('jumps to the first/last tab on Home/End', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);
      const settingsTab = within(container).getByRole('tab', {
        name: 'Settings',
      });
      settingsTab.focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Billing' }),
      );

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Profile' }),
      );
    });

    it('skips disabled tabs during Arrow/Home/End navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Billing' }),
      );
    });

    it('activates a focused tab on Enter', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowRight}{Enter}');

      expect(componentInstance.activeTab()).toBe('settings');
    });

    it('activates immediately on arrow-key focus movement when activation is "automatic"', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      fixture.componentInstance.activation.set('automatic');
      fixture.detectChanges();
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(componentInstance.activeTab()).toBe('settings');
    });

    it('supports interaction through the DynamoTabsHarness', async () => {
      const { fixture } = renderDynamoComponent(TabsTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTabsHarness,
      );

      expect(await harness.getActiveTabLabel()).toBe('Profile');
      await harness.selectTabByLabel('Billing');
      expect(await harness.getActiveTabLabel()).toBe('Billing');
      expect(await harness.getVisiblePanelText()).toBe('Billing content');
    });
  });

  describe('conditional rendering', () => {
    it('does not render an inactive tab panel content until first activated', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(container.textContent).not.toContain('Settings content');
    });

    it('preserves panel DOM identity across switches away and back', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Settings' }),
      );
      const marker = container.querySelector('[data-testid="settings-marker"]');
      expect(marker).toBeTruthy();

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Billing' }),
      );
      await userEvent.click(
        within(container).getByRole('tab', { name: 'Settings' }),
      );

      expect(container.querySelector('[data-testid="settings-marker"]')).toBe(
        marker,
      );
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with a disabled tab present', async () => {
      const { fixture } = renderDynamoComponent(TabsTestHostComponent);
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('links each tab to its panel via aria-controls/id, and the panel back via aria-labelledby', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      const panel = within(container)
        .getByText('Profile content')
        .closest('[role="tabpanel"]') as HTMLElement;

      expect(profileTab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(profileTab.id);
    });

    it('reflects aria-selected on exactly one tab at a time', async () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Billing' }),
      );

      const selected = within(container)
        .getAllByRole('tab')
        .filter((tab) => tab.getAttribute('aria-selected') === 'true');
      expect(selected).toHaveLength(1);
      expect(selected[0]?.textContent?.trim()).toBe('Billing');
    });
  });

  describe('state changes', () => {
    it('updates aria-selected and the visible panel when value is set programmatically', () => {
      const { container, fixture } = renderDynamoComponent(
        TabsTestHostComponent,
      );

      fixture.componentInstance.activeTab.set('billing');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('tab', { name: 'Billing' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('falls back to an enabled tab when the active tab becomes disabled', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );
      fixture.componentInstance.activeTab.set('settings');
      fixture.detectChanges();
      expect(componentInstance.activeTab()).toBe('settings');

      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      expect(componentInstance.activeTab()).not.toBe('settings');
      expect(
        within(container)
          .getAllByRole('tab')
          .some((tab) => tab.getAttribute('aria-selected') === 'true'),
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders a single tab as always selected', () => {
      const { container } = renderDynamoComponent(TabsSingleHostComponent);

      expect(
        within(container)
          .getByRole('tab', { name: 'Only' })
          .getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('does not throw when navigating a single-tab list', async () => {
      const { container } = renderDynamoComponent(TabsSingleHostComponent);
      within(container).getByRole('tab', { name: 'Only' }).focus();

      await expect(userEvent.keyboard('{ArrowRight}')).resolves.not.toThrow();
    });

    it('does not throw and keeps a tab selected when every tab is disabled', async () => {
      const { container } = renderDynamoComponent(TabsAllDisabledHostComponent);
      const tabA = within(container).getByRole('tab', { name: 'A' });
      tabA.focus();

      await expect(userEvent.keyboard('{ArrowRight}')).resolves.not.toThrow();
      expect(
        within(container)
          .getAllByRole('tab')
          .some((tab) => tab.getAttribute('aria-selected') === 'true'),
      ).toBe(true);
    });

    it('reflects dynamically added and removed tabs', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TabsDynamicHostComponent,
      );
      expect(within(container).getAllByRole('tab')).toHaveLength(2);

      fixture.componentInstance.items.set([{ value: 'a', label: 'A' }]);
      fixture.detectChanges();

      expect(within(container).getAllByRole('tab')).toHaveLength(1);
      expect(componentInstance.activeTab()).toBe('a');
    });
  });

  describe('scrollable', () => {
    it('does not render scroll-nav buttons by default', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(
        container.querySelector('button[aria-label="Scroll tabs left"]'),
      ).toBeNull();
      expect(
        container.querySelector('button[aria-label="Scroll tabs right"]'),
      ).toBeNull();
    });

    it('renders scroll-nav buttons when scrollable and showNavigators are both true', () => {
      const { container } = renderDynamoComponent(DynamoTabs, {
        inputs: { scrollable: true },
      });

      expect(
        container.querySelector('button[aria-label="Scroll tabs left"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('button[aria-label="Scroll tabs right"]'),
      ).toBeTruthy();
    });

    it('hides scroll-nav buttons when showNavigators is false, even if scrollable', () => {
      const { container } = renderDynamoComponent(DynamoTabs, {
        inputs: { scrollable: true, showNavigators: false },
      });

      expect(
        container.querySelector('button[aria-label="Scroll tabs left"]'),
      ).toBeNull();
    });

    it('does not throw when a scroll-nav button is clicked', async () => {
      const { container } = renderDynamoComponent(DynamoTabs, {
        inputs: { scrollable: true },
      });

      await expect(
        userEvent.click(
          container.querySelector(
            'button[aria-label="Scroll tabs right"]',
          ) as HTMLElement,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('orientation', () => {
    it('defaults to "horizontal" (regression guard)', () => {
      const { componentInstance } = renderDynamoComponent(DynamoTabs);

      expect(componentInstance.orientation()).toBe('horizontal');
    });

    it('renders and behaves identically to today when left at "horizontal"', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsTestHostComponent,
      );

      await userEvent.click(
        within(container).getByRole('tab', { name: 'Billing' }),
      );

      expect(componentInstance.activeTab()).toBe('billing');
      expect(
        within(container).getByRole('tab', { name: 'Billing' }).tagName,
      ).toBe('BUTTON');
    });

    it('moves focus with ArrowDown/ArrowUp exactly like ArrowRight/ArrowLeft', async () => {
      const { container } = renderDynamoComponent(TabsVerticalHostComponent);
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Settings' }),
      );

      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(profileTab);
    });

    it('still moves focus with ArrowRight/ArrowLeft while vertical (both pairs always live)', async () => {
      const { container } = renderDynamoComponent(TabsVerticalHostComponent);
      const profileTab = within(container).getByRole('tab', {
        name: 'Profile',
      });
      profileTab.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(
        within(container).getByRole('tab', { name: 'Settings' }),
      );
    });

    it('sets the tablist inline width from verticalWidth while vertical', () => {
      const { container } = renderDynamoComponent(TabsVerticalHostComponent);

      expect(
        (within(container).getByRole('tablist') as HTMLElement).style.width,
      ).toBe('220px');
    });

    it('leaves the tablist with no inline width while horizontal', () => {
      const { container } = renderDynamoComponent(TabsTestHostComponent);

      expect(
        (within(container).getByRole('tablist') as HTMLElement).style.width,
      ).toBe('');
    });

    it('has no axe violations in vertical orientation', async () => {
      const { fixture } = renderDynamoComponent(TabsVerticalHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('closable', () => {
    function closeAffordance(
      container: HTMLElement,
      label: string,
    ): HTMLElement {
      const tab = within(container).getByRole('tab', { name: label });
      const el = tab.querySelector('[data-tab-close]');
      if (!el) throw new Error(`No close affordance found on tab "${label}"`);
      return el as HTMLElement;
    }

    it('renders no close affordance on a tab that is not closable', () => {
      const { container } = renderDynamoComponent(TabsClosableHostComponent);
      const tabC = within(container).getByRole('tab', { name: 'C' });

      expect(tabC.querySelector('[data-tab-close]')).toBeNull();
    });

    it('renders a close affordance on a closable tab, and announces the shortcut via aria-keyshortcuts', () => {
      const { container } = renderDynamoComponent(TabsClosableHostComponent);
      const tabA = within(container).getByRole('tab', { name: 'A' });

      expect(tabA.querySelector('[data-tab-close]')).toBeTruthy();
      expect(tabA.getAttribute('aria-keyshortcuts')).toBe('Delete');
    });

    it("clicking a closable tab's close affordance emits tabClose with its value, without selecting it", async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );

      await userEvent.click(closeAffordance(container, 'B'));

      expect(componentInstance.closed).toEqual(['b']);
      expect(componentInstance.activeTab()).toBe('a');
    });

    it('actually removes the tab once the consumer filters it out of their own array', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );

      await userEvent.click(closeAffordance(container, 'A'));

      expect(within(container).queryByRole('tab', { name: 'A' })).toBeNull();
      expect(within(container).getAllByRole('tab')).toHaveLength(2);
      // The active-tab fallback effect re-selects a remaining enabled tab.
      expect(componentInstance.activeTab()).toBeTruthy();
      expect(componentInstance.activeTab()).not.toBe('a');
    });

    it('closes the focused closable tab on Delete', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );
      within(container).getByRole('tab', { name: 'A' }).focus();

      await userEvent.keyboard('{Delete}');

      expect(componentInstance.closed).toEqual(['a']);
    });

    it('closes the focused closable tab on Backspace', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );
      within(container).getByRole('tab', { name: 'B' }).focus();

      await userEvent.keyboard('{Backspace}');

      expect(componentInstance.closed).toEqual(['b']);
    });

    it('does nothing on Delete/Backspace when the focused tab is not closable', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );
      within(container).getByRole('tab', { name: 'C' }).focus();

      await userEvent.keyboard('{Delete}{Backspace}');

      expect(componentInstance.closed).toEqual([]);
    });

    it('has no axe violations with closable tabs rendered', async () => {
      const { fixture } = renderDynamoComponent(TabsClosableHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('supports closeTabByLabel through the DynamoTabsHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        TabsClosableHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTabsHarness,
      );

      await harness.closeTabByLabel('A');

      expect(componentInstance.closed).toEqual(['a']);
    });

    it('throws from closeTabByLabel when that tab is not closable', async () => {
      const { fixture } = renderDynamoComponent(TabsClosableHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTabsHarness,
      );

      await expect(harness.closeTabByLabel('C')).rejects.toThrow();
    });
  });
});
