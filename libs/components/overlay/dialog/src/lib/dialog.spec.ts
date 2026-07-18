import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoDialog } from './dialog';
import { DynamoDialogHarness } from './dialog.harness';

@Component({
  selector: 'dg-dialog-test-host',
  standalone: true,
  imports: [DynamoDialog],
  template: `
    <button type="button" (click)="isOpen.set(true)">Open dialog</button>
    <dg-dialog [(open)]="isOpen" title="Delete item">Are you sure?</dg-dialog>
  `,
})
class DialogTestHostComponent {
  readonly isOpen = model(false);
}

/** CDK's ConfigurableFocusTrap moves initial focus asynchronously; flush that before asserting on it. */
function flushFocusTrap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DynamoDialog', () => {
  describe('creation', () => {
    it('renders nothing in the DOM when closed', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { title: 'Title' } });

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders a [role="dialog"] element when open', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDialog, { inputs: { title: 'Title' } });

      expect(componentInstance.open()).toBe(false);
    });

    it('defaults closeOnBackdropClick and closeOnEscape to true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDialog, { inputs: { title: 'Title' } });

      expect(componentInstance.closeOnBackdropClick()).toBe(true);
      expect(componentInstance.closeOnEscape()).toBe(true);
    });
  });

  describe('input properties', () => {
    it('reflects the title input as the dialog heading', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Delete item' } });

      expect(within(container).getByRole('heading', { name: 'Delete item' })).toBeTruthy();
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title' },
      });

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });

    it('does not render a header when no title is provided', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, ariaLabel: 'Untitled' } });

      expect(container.querySelector('h2')).toBeNull();
    });
  });

  describe('output events', () => {
    it('sets open to false (via the model output) when the close button is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title' },
      });

      await userEvent.click(within(container).getByRole('button', { name: 'Close dialog' }));

      expect(componentInstance.open()).toBe(false);
    });

    it('calling close() programmatically sets open to false', () => {
      const { componentInstance } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });

      componentInstance.close();

      expect(componentInstance.open()).toBe(false);
    });

    it('propagates close back to a two-way-bound host signal', async () => {
      const { container, componentInstance } = renderDynamoComponent(DialogTestHostComponent);
      await userEvent.click(within(container).getByRole('button', { name: 'Open dialog' }));
      expect(componentInstance.isOpen()).toBe(true);

      await userEvent.click(within(container).getByRole('button', { name: 'Close dialog' }));

      expect(componentInstance.isOpen()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('closes when the Escape key is pressed while focus is inside the dialog', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title' },
      });
      const panel = container.querySelector('[role="dialog"]') as HTMLElement;
      panel.focus();

      await userEvent.keyboard('{Escape}');

      expect(componentInstance.open()).toBe(false);
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title' },
      });
      const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;

      await userEvent.click(backdrop);

      expect(componentInstance.open()).toBe(false);
    });

    it('does not close when the panel itself is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title' },
      });
      const panel = container.querySelector('[role="dialog"]') as HTMLElement;

      await userEvent.click(panel);

      expect(componentInstance.open()).toBe(true);
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoDialog, {
        inputs: { open: true, title: 'Title', closeOnBackdropClick: false },
      });
      const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;

      await userEvent.click(backdrop);

      expect(componentInstance.open()).toBe(true);
    });

    it('supports interaction through the DynamoDialogHarness', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoDialog, { inputs: { title: 'Delete item' } });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoDialogHarness);
      expect(await harness.isOpen()).toBe(false);

      setInputs({ open: true });

      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getTitleText()).toBe('Delete item');
      await harness.close();
      expect(fixture.componentInstance.open()).toBe(false);
    });
  });

  describe('conditional rendering', () => {
    it('renders projected body content only while open', async () => {
      const { container } = renderDynamoComponent(DialogTestHostComponent);
      expect(container.textContent).not.toContain('Are you sure?');

      await userEvent.click(within(container).getByRole('button', { name: 'Open dialog' }));

      expect(container.textContent).toContain('Are you sure?');
    });
  });

  describe('template behavior', () => {
    it('sets aria-labelledby to the title heading id when a title is given', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });

      const panel = container.querySelector('[role="dialog"]') as HTMLElement;
      const headingId = container.querySelector('h2')?.id;
      expect(panel.getAttribute('aria-labelledby')).toBe(headingId);
    });

    it('sets aria-label instead when ariaLabel is provided without a title', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, ariaLabel: 'Settings' } });

      const panel = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(panel.getAttribute('aria-label')).toBe('Settings');
      expect(panel.getAttribute('aria-labelledby')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when open with a title', async () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when open with only ariaLabel', async () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, ariaLabel: 'Settings' } });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('marks the backdrop as aria-hidden so it is excluded from the accessibility tree', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });

      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('moves focus inside the dialog panel when opened', async () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, title: 'Title' } });
      await flushFocusTrap();

      const panel = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(panel.contains(document.activeElement)).toBe(true);
    });
  });

  describe('state changes', () => {
    it('returns focus to the trigger element when the dialog closes', async () => {
      const { container } = renderDynamoComponent(DialogTestHostComponent);
      const trigger = within(container).getByRole('button', { name: 'Open dialog' }) as HTMLButtonElement;
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      await userEvent.click(trigger);
      await flushFocusTrap();
      expect(document.activeElement).not.toBe(trigger);

      await userEvent.click(within(container).getByRole('button', { name: 'Close dialog' }));

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close toggling without throwing', () => {
      const { setInputs } = renderDynamoComponent(DynamoDialog, { inputs: { title: 'Title' } });

      expect(() => {
        for (let i = 0; i < 5; i++) {
          setInputs({ open: true });
          setInputs({ open: false });
        }
      }).not.toThrow();
    });

    it('renders correctly with no projected content and no title', () => {
      const { container } = renderDynamoComponent(DynamoDialog, { inputs: { open: true, ariaLabel: 'Empty' } });

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });
  });
});
