import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { expectNoA11yViolations } from '@dynamong/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DynamoToastService } from './toast.service';

// The toast container is portaled into a `.cdk-overlay-container` appended
// near document.body, same reasoning as DynamoTooltip's/DynamoMenu's specs —
// there is no consumer-authored host element at all here (the service
// self-mounts its container), so every assertion below queries document.body.
function getCards(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('[role="status"] > div'));
}

function getContainer(): HTMLElement | null {
  return document.body.querySelector('[role="status"]');
}

describe('DynamoToastService', () => {
  let service: DynamoToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(DynamoToastService);
  });

  afterEach(() => {
    service.dismissAll();
  });

  describe('defaults', () => {
    it('defaults severity to "info", duration to 5000, closable to true, position to "top-right"', () => {
      service.show({ message: 'Hello' });

      const card = getCards()[0];
      expect(card?.className).toContain('border-info');
      expect(
        card?.querySelector('[aria-label="Dismiss notification"]'),
      ).not.toBeNull();
    });
  });

  describe('show()', () => {
    it('returns an id and renders a card with the message and title', () => {
      const id = service.show({ message: 'Saved successfully', title: 'Done' });

      expect(typeof id).toBe('string');
      const card = getCards()[0];
      expect(card?.textContent).toContain('Done');
      expect(card?.textContent).toContain('Saved successfully');
    });

    it('applies the requested severity as the card border color', () => {
      service.show({ message: 'Careful', severity: 'warning' });

      expect(getCards()[0]?.className).toContain('border-warning');
    });
  });

  describe('convenience methods', () => {
    it('success() uses severity "success"', () => {
      service.success('Saved!');
      expect(getCards()[0]?.className).toContain('border-success');
    });

    it('info() uses severity "info"', () => {
      service.info('FYI');
      expect(getCards()[0]?.className).toContain('border-info');
    });

    it('warning() uses severity "warning"', () => {
      service.warning('Careful');
      expect(getCards()[0]?.className).toContain('border-warning');
    });

    it('error() uses severity "danger"', () => {
      service.error('Something broke');
      expect(getCards()[0]?.className).toContain('border-danger');
    });
  });

  describe('stacking and positions', () => {
    it('stacks multiple toasts in the same container', () => {
      service.show({ message: 'First' });
      service.show({ message: 'Second' });

      expect(getCards()).toHaveLength(2);
    });

    it('renders toasts requesting different positions in separate containers', () => {
      service.show({ message: 'Top right', position: 'top-right' });
      service.show({ message: 'Bottom left', position: 'bottom-left' });

      const containers = document.body.querySelectorAll('[role="status"]');
      expect(containers).toHaveLength(2);
    });
  });

  describe('dismiss()', () => {
    it('removes only the dismissed toast', () => {
      const firstId = service.show({ message: 'First' });
      service.show({ message: 'Second' });

      service.dismiss(firstId);

      expect(getCards()).toHaveLength(1);
      expect(getCards()[0]?.textContent).toContain('Second');
    });

    it('does not throw for an unknown id', () => {
      expect(() => service.dismiss('not-a-real-id')).not.toThrow();
    });

    it('is triggered by clicking the close button', () => {
      service.show({ message: 'Dismiss me' });
      const closeButton = getCards()[0]?.querySelector(
        '[aria-label="Dismiss notification"]',
      ) as HTMLElement;

      closeButton.click();

      expect(getCards()).toHaveLength(0);
    });

    it('does not render a close button when closable is false', () => {
      service.show({ message: 'Persistent', closable: false, duration: 0 });

      expect(
        getCards()[0]?.querySelector('[aria-label="Dismiss notification"]'),
      ).toBeNull();
    });
  });

  describe('dismissAll()', () => {
    it('clears every toast', () => {
      service.show({ message: 'First' });
      service.show({ message: 'Second', position: 'bottom-left' });

      service.dismissAll();

      expect(getCards()).toHaveLength(0);
    });

    it('does not throw when there is nothing to dismiss', () => {
      expect(() => service.dismissAll()).not.toThrow();
    });
  });

  describe('auto-dismiss', () => {
    it('removes the toast automatically after duration elapses', async () => {
      service.show({ message: 'Fleeting', duration: 20 });
      expect(getCards()).toHaveLength(1);

      await new Promise((resolve) => setTimeout(resolve, 40));

      expect(getCards()).toHaveLength(0);
    });

    it('never auto-dismisses when duration is 0', async () => {
      service.show({ message: 'Sticks around', duration: 0 });

      await new Promise((resolve) => setTimeout(resolve, 40));

      expect(getCards()).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('renders the container as a polite live region', () => {
      service.show({ message: 'Hello' });

      const container = getContainer();
      expect(container?.getAttribute('role')).toBe('status');
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });

    it('has no axe violations with a toast rendered', async () => {
      service.show({ message: 'Saved', title: 'Success', severity: 'success' });

      await expect(
        expectNoA11yViolations(getContainer() as HTMLElement),
      ).resolves.toBeUndefined();
    });
  });
});
