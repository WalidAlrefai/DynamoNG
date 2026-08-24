import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoDrawer } from './drawer';
import { DynamoDrawerHarness } from './drawer.harness';

// The CDK overlay portals `role="dialog"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element —
// same reasoning as DynamoMenu's/DynamoTooltip's specs.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

// Flushes the double-rAF the open sequence uses to defer the closed->open
// transform flip (see drawer.ts's beginOpen), plus the focus trap's own
// async initial-focus resolution (same reasoning as dialog.spec.ts's
// flushFocusTrap).
async function settleOpen(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

// Flushes the close sequence's detach delay (CLOSE_DURATION_MS = 200 in
// drawer.ts — kept in sync with drawerPanelStyles' duration-200 class).
async function settleClose(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 220));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-drawer-test-host',
  standalone: true,
  imports: [DynamoDrawer],
  template: `
    <button type="button" (click)="isOpen.set(true)">Open drawer</button>
    <dg-drawer [(open)]="isOpen" title="Filters">Filter controls</dg-drawer>
  `,
})
class DrawerTestHostComponent {
  readonly isOpen = model(false);
}

describe('DynamoDrawer', () => {
  describe('creation', () => {
    it('renders nothing in document.body when closed', () => {
      renderDynamoComponent(DynamoDrawer, { inputs: { title: 'Title' } });

      expect(getPanel()).toBeNull();
    });

    it('renders a [role="dialog"] element in document.body when open', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDrawer, {
        inputs: { title: 'Title' },
      });

      expect(componentInstance.open()).toBe(false);
    });

    it('defaults position to right and size to md', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDrawer, {
        inputs: { title: 'Title' },
      });

      expect(componentInstance.position()).toBe('right');
      expect(componentInstance.size()).toBe('md');
    });

    it('defaults closeOnBackdropClick and closeOnEscape to true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDrawer, {
        inputs: { title: 'Title' },
      });

      expect(componentInstance.closeOnBackdropClick()).toBe(true);
      expect(componentInstance.closeOnEscape()).toBe(true);
    });
  });

  describe('input properties', () => {
    it('reflects the title input as the drawer heading', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Filters' },
      });
      await settleOpen(fixture);

      expect(
        within(document.body).getByRole('heading', { name: 'Filters' }),
      ).toBeTruthy();
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { title: 'Title' },
        },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });

    it('accepts every documented position without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { title: 'Title' },
        },
      );

      for (const position of ['left', 'right', 'top', 'bottom'] as const) {
        setInputs({ position });
        expect(componentInstance.position()).toBe(position);
      }
    });

    it('does not render a header when no title is provided', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, ariaLabel: 'Untitled' },
      });
      await settleOpen(fixture);

      expect(document.body.querySelector('h2')).toBeNull();
    });
  });

  describe('output events', () => {
    it('sets open to false (via the model output) when the close button is clicked', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title' },
        },
      );
      await settleOpen(fixture);

      await userEvent.click(
        within(document.body).getByRole('button', { name: 'Close drawer' }),
      );

      expect(componentInstance.open()).toBe(false);
    });

    it('calling close() programmatically sets open to false', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title' },
        },
      );
      await settleOpen(fixture);

      componentInstance.close();

      expect(componentInstance.open()).toBe(false);
    });

    it('propagates close back to a two-way-bound host signal', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DrawerTestHostComponent,
      );
      await userEvent.click(
        within(container).getByRole('button', { name: 'Open drawer' }),
      );
      await settleOpen(fixture);
      expect(componentInstance.isOpen()).toBe(true);

      await userEvent.click(
        within(document.body).getByRole('button', { name: 'Close drawer' }),
      );

      expect(componentInstance.isOpen()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('closes when the Escape key is pressed while focus is inside the drawer', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title' },
        },
      );
      await settleOpen(fixture);
      const panel = getPanel() as HTMLElement;
      panel.focus();

      await userEvent.keyboard('{Escape}');

      expect(componentInstance.open()).toBe(false);
    });

    it('closes when the backdrop is clicked', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title' },
        },
      );
      await settleOpen(fixture);
      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;

      await userEvent.click(backdrop);

      expect(componentInstance.open()).toBe(false);
    });

    it('does not close when the panel itself is clicked', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title' },
        },
      );
      await settleOpen(fixture);
      const panel = getPanel() as HTMLElement;

      await userEvent.click(panel);

      expect(componentInstance.open()).toBe(true);
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoDrawer,
        {
          inputs: { open: true, title: 'Title', closeOnBackdropClick: false },
        },
      );
      await settleOpen(fixture);
      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;

      await userEvent.click(backdrop);

      expect(componentInstance.open()).toBe(true);
    });

    it('supports interaction through the DynamoDrawerHarness', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoDrawer, {
        inputs: { title: 'Filters' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDrawerHarness,
      );
      expect(await harness.isOpen()).toBe(false);

      setInputs({ open: true });
      await settleOpen(fixture);

      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getTitleText()).toBe('Filters');
      await harness.close();
      expect(fixture.componentInstance.open()).toBe(false);
    });
  });

  describe('conditional rendering', () => {
    it('renders projected body content only while open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DrawerTestHostComponent,
      );
      expect(document.body.textContent).not.toContain('Filter controls');

      await userEvent.click(
        within(container).getByRole('button', { name: 'Open drawer' }),
      );
      await settleOpen(fixture);

      expect(document.body.textContent).toContain('Filter controls');
    });
  });

  describe('template behavior', () => {
    it('sets aria-labelledby to the title heading id when a title is given', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);

      const panel = getPanel() as HTMLElement;
      const headingId = document.body.querySelector('h2')?.id;
      expect(panel.getAttribute('aria-labelledby')).toBe(headingId);
    });

    it('sets aria-label instead when ariaLabel is provided without a title', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, ariaLabel: 'Settings' },
      });
      await settleOpen(fixture);

      const panel = getPanel() as HTMLElement;
      expect(panel.getAttribute('aria-label')).toBe('Settings');
      expect(panel.getAttribute('aria-labelledby')).toBeNull();
    });

    it.each(['left', 'right', 'top', 'bottom'] as const)(
      'applies a slide-in transform class for position=%s once open',
      async (position) => {
        const { fixture } = renderDynamoComponent(DynamoDrawer, {
          inputs: { open: true, title: 'Title', position },
        });
        await settleOpen(fixture);

        const panel = getPanel() as HTMLElement;
        const translateClass = [...panel.classList].find((c) =>
          c.includes('translate'),
        );
        expect(translateClass).toBeTruthy();
      },
    );
  });

  describe('accessibility', () => {
    it('has no axe violations when open with a title', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);
      await expect(
        expectNoA11yViolations(document.body),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations when open with only ariaLabel', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, ariaLabel: 'Settings' },
      });
      await settleOpen(fixture);
      await expect(
        expectNoA11yViolations(document.body),
      ).resolves.toBeUndefined();
    });

    it('moves focus inside the drawer panel when opened', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);

      const panel = getPanel() as HTMLElement;
      expect(panel.contains(document.activeElement)).toBe(true);
    });
  });

  describe('state changes', () => {
    it('returns focus to the trigger element as soon as closing begins', async () => {
      const { container, fixture } = renderDynamoComponent(
        DrawerTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open drawer',
      }) as HTMLButtonElement;
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      await userEvent.click(trigger);
      await settleOpen(fixture);
      expect(document.activeElement).not.toBe(trigger);

      await userEvent.click(
        within(document.body).getByRole('button', { name: 'Close drawer' }),
      );
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('animation', () => {
    it('keeps the panel in document.body immediately after closing, removing it only once the close transition settles', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);
      expect(getPanel()).not.toBeNull();

      setInputs({ open: false });
      expect(getPanel()).not.toBeNull();

      await settleClose(fixture);
      expect(getPanel()).toBeNull();
    });

    it('cancels the pending detach when reopened during the close transition', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, title: 'Title' },
      });
      await settleOpen(fixture);

      setInputs({ open: false });
      setInputs({ open: true });
      await settleClose(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close toggling without throwing', () => {
      const { setInputs } = renderDynamoComponent(DynamoDrawer, {
        inputs: { title: 'Title' },
      });

      expect(() => {
        for (let i = 0; i < 5; i++) {
          setInputs({ open: true });
          setInputs({ open: false });
        }
      }).not.toThrow();
    });

    it('renders correctly with no projected content and no title', async () => {
      const { fixture } = renderDynamoComponent(DynamoDrawer, {
        inputs: { open: true, ariaLabel: 'Empty' },
      });
      await settleOpen(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });
});
