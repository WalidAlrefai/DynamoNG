import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { expectNoA11yViolations } from '@dynamong/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DynamoConfirmService } from './confirm.service';

// The confirm panel is portaled into a `.cdk-overlay-container` appended near
// document.body — there's no consumer-authored host element at all (the
// service self-mounts its container), so every assertion below queries
// document.body, same reasoning as DynamoToastService's spec.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="alertdialog"]');
}

function getBackdrop(): HTMLElement | null {
  return document.body.querySelector('.cdk-overlay-backdrop');
}

/** CDK's ConfigurableFocusTrap moves initial focus asynchronously; flush that before asserting on it. */
function flushFocusTrap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('DynamoConfirmService', () => {
  let service: DynamoConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(DynamoConfirmService);
  });

  afterEach(() => {
    // Settle any prompt left open by a test so it doesn't leak into the next one.
    service.cancel();
  });

  describe('open()', () => {
    it('returns a promise resolving true when confirmed', async () => {
      const result = service.open({ message: 'Are you sure?' });
      (
        getPanel()?.querySelectorAll('button')[1] as HTMLElement
      ).click();

      await expect(result).resolves.toBe(true);
    });

    it('returns a promise resolving false when cancelled', async () => {
      const result = service.open({ message: 'Are you sure?' });
      (
        getPanel()?.querySelectorAll('button')[0] as HTMLElement
      ).click();

      await expect(result).resolves.toBe(false);
    });
  });

  describe('defaults', () => {
    it('defaults confirmLabel/cancelLabel to Confirm/Cancel and severity to primary', () => {
      service.open({ message: 'Are you sure?' });

      const buttons = getPanel()?.querySelectorAll('button');
      expect(buttons?.[0]?.textContent).toContain('Cancel');
      expect(buttons?.[1]?.textContent).toContain('Confirm');
    });

    it('renders custom labels and forwards severity to the confirm button', () => {
      service.open({
        message: 'Delete this?',
        confirmLabel: 'Delete',
        cancelLabel: 'Keep',
        severity: 'danger',
      });

      const buttons = getPanel()?.querySelectorAll('button');
      expect(buttons?.[0]?.textContent).toContain('Keep');
      expect(buttons?.[1]?.textContent).toContain('Delete');
      expect(buttons?.[1]?.className).toContain('danger');
    });
  });

  describe('title', () => {
    it('renders a heading and aria-labelledby/aria-describedby only when a title is given', () => {
      service.open({ message: 'Body text', title: 'Heads up' });

      const panel = getPanel();
      expect(panel?.querySelector('h2')?.textContent?.trim()).toBe('Heads up');
      expect(panel?.hasAttribute('aria-labelledby')).toBe(true);
      expect(panel?.hasAttribute('aria-describedby')).toBe(true);
      expect(panel?.hasAttribute('aria-label')).toBe(false);
    });

    it('falls back to aria-label on the message when there is no title', () => {
      service.open({ message: 'Body text only' });

      const panel = getPanel();
      expect(panel?.querySelector('h2')).toBeNull();
      expect(panel?.getAttribute('aria-label')).toBe('Body text only');
      expect(panel?.hasAttribute('aria-labelledby')).toBe(false);
      expect(panel?.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('backdrop click', () => {
    it('resolves false on backdrop click by default', async () => {
      const result = service.open({ message: 'Are you sure?' });
      (getBackdrop() as HTMLElement).click();

      await expect(result).resolves.toBe(false);
    });

    it('does not close when closeOnBackdropClick is false', async () => {
      service.open({ message: 'Are you sure?', closeOnBackdropClick: false });
      (getBackdrop() as HTMLElement).click();

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('escape key', () => {
    it('resolves false on Escape by default', async () => {
      const result = service.open({ message: 'Are you sure?' });
      (getPanel() as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );

      await expect(result).resolves.toBe(false);
    });

    it('does not close when closeOnEscape is false', () => {
      service.open({ message: 'Are you sure?', closeOnEscape: false });
      (getPanel() as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('queueing', () => {
    it('shows only one prompt at a time and presents the next once the first settles', async () => {
      const first = service.open({ message: 'First' });
      service.open({ message: 'Second' });

      expect(document.body.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
      expect(getPanel()?.textContent).toContain('First');

      service.confirm();
      await first;

      expect(document.body.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
      expect(getPanel()?.textContent).toContain('Second');

      service.confirm();
    });
  });

  describe('disposal', () => {
    it('removes the panel from the DOM once settled', async () => {
      const result = service.open({ message: 'Are you sure?' });
      service.confirm();
      await result;

      expect(getPanel()).toBeNull();
    });
  });

  describe('focus management', () => {
    it('moves focus into the panel when opened', async () => {
      service.open({ message: 'Are you sure?' });
      await flushFocusTrap();

      expect(getPanel()?.contains(document.activeElement)).toBe(true);
    });

    it('returns focus to the previously-focused element on close', async () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const result = service.open({ message: 'Are you sure?' });
      await flushFocusTrap();
      service.confirm();
      await result;

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  describe('accessibility', () => {
    it('uses role="alertdialog", not role="dialog"', () => {
      service.open({ message: 'Are you sure?' });
      expect(getPanel()?.getAttribute('role')).toBe('alertdialog');
    });

    it('has no axe violations with a title', async () => {
      service.open({ message: 'Are you sure?', title: 'Confirm' });
      await expect(
        expectNoA11yViolations(getPanel() as HTMLElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations without a title', async () => {
      service.open({ message: 'Are you sure?' });
      await expect(
        expectNoA11yViolations(getPanel() as HTMLElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('does not throw on rapid open/confirm/open cycles', () => {
      expect(() => {
        service.open({ message: 'One' });
        service.confirm();
        service.open({ message: 'Two' });
        service.confirm();
        service.open({ message: 'Three' });
      }).not.toThrow();
    });

    it('confirm()/cancel() are no-ops when nothing is open', () => {
      expect(() => {
        service.confirm();
        service.cancel();
      }).not.toThrow();
    });
  });
});
