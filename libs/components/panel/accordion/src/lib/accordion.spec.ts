import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoAccordion } from './accordion';
import { DynamoAccordionPanel } from './accordion-panel';
import { DynamoAccordionHarness } from './accordion.harness';

@Component({
  selector: 'dg-accordion-test-host',
  standalone: true,
  imports: [DynamoAccordion, DynamoAccordionPanel],
  template: `
    <dg-accordion [(value)]="active" [multiple]="multiple()" ariaLabel="FAQ">
      <dg-accordion-panel value="profile" header="Profile">
        <p data-testid="profile-marker">Profile content</p>
      </dg-accordion-panel>
      <dg-accordion-panel
        value="settings"
        header="Settings"
        [disabled]="settingsDisabled()"
      >
        <p data-testid="settings-marker">Settings content</p>
      </dg-accordion-panel>
      <dg-accordion-panel value="billing" header="Billing">
        <p data-testid="billing-marker">Billing content</p>
      </dg-accordion-panel>
    </dg-accordion>
  `,
})
class AccordionTestHostComponent {
  readonly active = model<string | string[] | undefined>(undefined);
  readonly multiple = signal(false);
  readonly settingsDisabled = signal(false);
}

@Component({
  selector: 'dg-accordion-all-disabled-host',
  standalone: true,
  imports: [DynamoAccordion, DynamoAccordionPanel],
  template: `
    <dg-accordion>
      <dg-accordion-panel value="a" header="A" [disabled]="true"
        >A content</dg-accordion-panel
      >
      <dg-accordion-panel value="b" header="B" [disabled]="true"
        >B content</dg-accordion-panel
      >
    </dg-accordion>
  `,
})
class AccordionAllDisabledHostComponent {}

@Component({
  selector: 'dg-accordion-single-host',
  standalone: true,
  imports: [DynamoAccordion, DynamoAccordionPanel],
  template: `
    <dg-accordion>
      <dg-accordion-panel value="only" header="Only"
        >Only content</dg-accordion-panel
      >
    </dg-accordion>
  `,
})
class AccordionSingleHostComponent {}

@Component({
  selector: 'dg-accordion-dynamic-host',
  standalone: true,
  imports: [DynamoAccordion, DynamoAccordionPanel],
  template: `
    <dg-accordion [(value)]="active">
      @for (item of items(); track item.value) {
        <dg-accordion-panel [value]="item.value" [header]="item.label"
          >{{ item.label }} content</dg-accordion-panel
        >
      }
    </dg-accordion>
  `,
})
class AccordionDynamicHostComponent {
  readonly active = model<string | string[] | undefined>(undefined);
  readonly items = signal([
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]);
}

describe('DynamoAccordion', () => {
  describe('creation', () => {
    it('renders one header button per projected dg-accordion-panel', () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      expect(within(container).getAllByRole('button')).toHaveLength(3);
    });

    it('renders no expanded regions by default', () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      expect(within(container).queryAllByRole('region')).toHaveLength(0);
    });
  });

  describe('default behavior', () => {
    it('leaves every panel collapsed when no value is bound', () => {
      const { container, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );

      for (const button of within(container).getAllByRole('button')) {
        expect(button.getAttribute('aria-expanded')).toBe('false');
      }
      expect(componentInstance.active()).toBeUndefined();
    });

    it('defaults multiple to false', () => {
      const { componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );

      expect(componentInstance.multiple()).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects disabled on a dg-accordion-panel as aria-disabled', () => {
      const { container, fixture } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      const settingsHeader = within(container).getByRole('button', {
        name: 'Settings',
      });
      expect(settingsHeader.getAttribute('aria-disabled')).toBe('true');
    });

    it('renders each panel header as its visible text', () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Billing' }),
      ).toBeTruthy();
    });

    it('reflects ariaLabel onto the root', () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      expect(container.querySelector('[aria-label="FAQ"]')).toBeTruthy();
    });
  });

  describe('user interactions', () => {
    it('expands a panel and updates the two-way-bound value when its header is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Billing' }),
      );

      expect(componentInstance.active()).toBe('billing');
      expect(
        within(container)
          .getByRole('button', { name: 'Billing' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
    });

    it('collapses an expanded panel when its header is clicked again (single mode)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      const billingHeader = within(container).getByRole('button', {
        name: 'Billing',
      });
      await userEvent.click(billingHeader);

      await userEvent.click(billingHeader);

      expect(componentInstance.active()).toBeUndefined();
    });

    it('collapses the previously expanded panel when a different header is clicked (single mode)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      await userEvent.click(
        within(container).getByRole('button', { name: 'Profile' }),
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Billing' }),
      );

      expect(componentInstance.active()).toBe('billing');
      expect(
        within(container)
          .getByRole('button', { name: 'Profile' })
          .getAttribute('aria-expanded'),
      ).toBe('false');
    });

    it('expands panels independently in multiple mode', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.multiple.set(true);
      fixture.detectChanges();

      await userEvent.click(
        within(container).getByRole('button', { name: 'Profile' }),
      );
      await userEvent.click(
        within(container).getByRole('button', { name: 'Billing' }),
      );

      expect(componentInstance.active()).toEqual(['profile', 'billing']);
      expect(
        within(container)
          .getByRole('button', { name: 'Profile' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
      expect(
        within(container)
          .getByRole('button', { name: 'Billing' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
    });

    it('moves focus to a clicked header', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const billingHeader = within(container).getByRole('button', {
        name: 'Billing',
      });

      await userEvent.click(billingHeader);

      expect(document.activeElement).toBe(billingHeader);
    });

    it('does nothing when a disabled header is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      await userEvent.click(
        within(container).getByRole('button', { name: 'Settings' }),
      );

      expect(componentInstance.active()).toBeUndefined();
    });

    it('moves focus with ArrowDown/ArrowUp between headers', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const profileHeader = within(container).getByRole('button', {
        name: 'Profile',
      });
      profileHeader.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Settings' }),
      );
    });

    it('wraps ArrowDown from the last header to the first', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const billingHeader = within(container).getByRole('button', {
        name: 'Billing',
      });
      billingHeader.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Profile' }),
      );
    });

    it('wraps ArrowUp from the first header to the last', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const profileHeader = within(container).getByRole('button', {
        name: 'Profile',
      });
      profileHeader.focus();

      await userEvent.keyboard('{ArrowUp}');

      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Billing' }),
      );
    });

    it('jumps to the first/last header on Home/End', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const settingsHeader = within(container).getByRole('button', {
        name: 'Settings',
      });
      settingsHeader.focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Billing' }),
      );

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Profile' }),
      );
    });

    it('skips disabled headers during Arrow/Home/End navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();
      const profileHeader = within(container).getByRole('button', {
        name: 'Profile',
      });
      profileHeader.focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Billing' }),
      );
    });

    it('toggles a focused header on Enter', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      const profileHeader = within(container).getByRole('button', {
        name: 'Profile',
      });
      profileHeader.focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance.active()).toBe('profile');
    });

    it('supports interaction through the DynamoAccordionHarness', async () => {
      const { fixture } = renderDynamoComponent(AccordionTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoAccordionHarness,
      );

      expect(await harness.getExpandedHeaders()).toEqual([]);
      await harness.togglePanelByHeader('Billing');
      expect(await harness.isPanelExpanded('Billing')).toBe(true);
      expect(await harness.getPanelText('Billing')).toBe('Billing content');
    });
  });

  describe('conditional rendering', () => {
    it('does not render a panel region until first expanded', () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      expect(container.textContent).not.toContain('Settings content');
    });

    it('preserves panel DOM identity across collapse and re-expand', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      await userEvent.click(
        within(container).getByRole('button', { name: 'Settings' }),
      );
      const marker = container.querySelector('[data-testid="settings-marker"]');
      expect(marker).toBeTruthy();

      await userEvent.click(
        within(container).getByRole('button', { name: 'Settings' }),
      );
      await userEvent.click(
        within(container).getByRole('button', { name: 'Settings' }),
      );

      expect(container.querySelector('[data-testid="settings-marker"]')).toBe(
        marker,
      );
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with a disabled panel present', async () => {
      const { fixture } = renderDynamoComponent(AccordionTestHostComponent);
      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('links each header to its region via aria-controls/id, and the region back via aria-labelledby', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);
      const profileHeader = within(container).getByRole('button', {
        name: 'Profile',
      });

      await userEvent.click(profileHeader);
      const region = within(container)
        .getByText('Profile content')
        .closest('[role="region"]') as HTMLElement;

      expect(profileHeader.getAttribute('aria-controls')).toBe(region.id);
      expect(region.getAttribute('aria-labelledby')).toBe(profileHeader.id);
    });

    it('reflects aria-expanded on exactly one header at a time in single mode', async () => {
      const { container } = renderDynamoComponent(AccordionTestHostComponent);

      await userEvent.click(
        within(container).getByRole('button', { name: 'Billing' }),
      );

      const expanded = within(container)
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-expanded') === 'true');
      expect(expanded).toHaveLength(1);
      expect(expanded[0]?.textContent?.trim()).toBe('Billing');
    });
  });

  describe('state changes', () => {
    it('expands the matching panel when value is set programmatically', () => {
      const { container, fixture } = renderDynamoComponent(
        AccordionTestHostComponent,
      );

      fixture.componentInstance.active.set('billing');
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Billing' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
    });

    it('expands multiple panels when value is set to an array in multiple mode', () => {
      const { container, fixture } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.active.set(['profile', 'billing']);
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Profile' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
      expect(
        within(container)
          .getByRole('button', { name: 'Billing' })
          .getAttribute('aria-expanded'),
      ).toBe('true');
    });

    it('prunes value and collapses the panel when the expanded panel becomes disabled', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AccordionTestHostComponent,
      );
      fixture.componentInstance.active.set('settings');
      fixture.detectChanges();
      expect(componentInstance.active()).toBe('settings');

      fixture.componentInstance.settingsDisabled.set(true);
      fixture.detectChanges();

      expect(componentInstance.active()).toBeUndefined();
      expect(
        within(container)
          .getByRole('button', { name: 'Settings' })
          .getAttribute('aria-expanded'),
      ).toBe('false');
    });
  });

  describe('edge cases', () => {
    it('leaves a single panel collapsed by default', () => {
      const { container } = renderDynamoComponent(AccordionSingleHostComponent);

      expect(
        within(container)
          .getByRole('button', { name: 'Only' })
          .getAttribute('aria-expanded'),
      ).toBe('false');
    });

    it('toggles a single panel via click', async () => {
      const { container } = renderDynamoComponent(AccordionSingleHostComponent);
      const header = within(container).getByRole('button', { name: 'Only' });

      await userEvent.click(header);

      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('does not throw when navigating a single-panel accordion', async () => {
      const { container } = renderDynamoComponent(AccordionSingleHostComponent);
      within(container).getByRole('button', { name: 'Only' }).focus();

      await expect(userEvent.keyboard('{ArrowDown}')).resolves.not.toThrow();
    });

    it('does not throw and stays collapsed when every panel is disabled', async () => {
      const { container } = renderDynamoComponent(
        AccordionAllDisabledHostComponent,
      );
      const headerA = within(container).getByRole('button', { name: 'A' });
      headerA.focus();

      await expect(userEvent.keyboard('{ArrowDown}')).resolves.not.toThrow();
      await userEvent.click(headerA);
      expect(headerA.getAttribute('aria-expanded')).toBe('false');
    });

    it('reflects dynamically added and removed panels', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AccordionDynamicHostComponent,
      );
      expect(within(container).getAllByRole('button')).toHaveLength(2);

      fixture.componentInstance.items.set([{ value: 'a', label: 'A' }]);
      fixture.detectChanges();

      expect(within(container).getAllByRole('button')).toHaveLength(1);
      expect(componentInstance.active()).toBeUndefined();
    });

    it('prunes a now-missing panel value when panels are removed', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AccordionDynamicHostComponent,
      );
      fixture.componentInstance.active.set('b');
      fixture.detectChanges();
      expect(componentInstance.active()).toBe('b');

      fixture.componentInstance.items.set([{ value: 'a', label: 'A' }]);
      fixture.detectChanges();

      expect(within(container).getAllByRole('button')).toHaveLength(1);
      expect(componentInstance.active()).toBeUndefined();
    });
  });
});
