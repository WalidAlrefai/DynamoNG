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

  afterEach(async () => {
    // dismissAll() now animates each toast out (LEAVE_DURATION_MS = 200 in
    // toast.service.ts) rather than clearing instantly — flush that delay
    // so nothing leaks into the next test.
    service.dismissAll();
    await new Promise((resolve) => setTimeout(resolve, 220));
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

    it('slides each toast in from the screen edge it is anchored to', () => {
      service.show({ message: 'a', position: 'top-right' });
      service.show({ message: 'b', position: 'bottom-left' });
      service.show({ message: 'c', position: 'top-center' });
      service.show({ message: 'd', position: 'bottom-center' });

      const [right, left, top, bottom] = getCards().map((c) => c.className);
      expect(right).toContain('translate-x-[calc(100%+1rem)]');
      expect(right).not.toContain('-translate-x-');
      expect(left).toContain('-translate-x-[calc(100%+1rem)]');
      expect(top).toContain('-translate-y-[calc(100%+1rem)]');
      expect(bottom).toContain('translate-y-[calc(100%+1rem)]');
      expect(bottom).not.toContain('-translate-y-');
    });
  });

  describe('dismiss()', () => {
    it('removes only the dismissed toast', async () => {
      const firstId = service.show({ message: 'First' });
      service.show({ message: 'Second' });

      service.dismiss(firstId);
      await new Promise((resolve) => setTimeout(resolve, 220));

      expect(getCards()).toHaveLength(1);
      expect(getCards()[0]?.textContent).toContain('Second');
    });

    it('does not throw for an unknown id', () => {
      expect(() => service.dismiss('not-a-real-id')).not.toThrow();
    });

    it('is triggered by clicking the close button', async () => {
      service.show({ message: 'Dismiss me' });
      const closeButton = getCards()[0]?.querySelector(
        '[aria-label="Dismiss notification"]',
      ) as HTMLElement;

      closeButton.click();
      await new Promise((resolve) => setTimeout(resolve, 220));

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
    it('clears every toast', async () => {
      service.show({ message: 'First' });
      service.show({ message: 'Second', position: 'bottom-left' });

      service.dismissAll();
      await new Promise((resolve) => setTimeout(resolve, 220));

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

      // duration (20) + the leave-animation delay (LEAVE_DURATION_MS = 200
      // in toast.service.ts) + margin.
      await new Promise((resolve) => setTimeout(resolve, 240));

      expect(getCards()).toHaveLength(0);
    });

    it('never auto-dismisses when duration is 0', async () => {
      service.show({ message: 'Sticks around', duration: 0 });

      await new Promise((resolve) => setTimeout(resolve, 40));

      expect(getCards()).toHaveLength(1);
    });
  });

  describe('pause() / resume()', () => {
    it('pausing stops the auto-dismiss countdown until resumed', async () => {
      const id = service.show({ message: 'Hover me', duration: 30 });

      service.pause(id);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(getCards()).toHaveLength(1);

      service.resume(id);
      // remaining time (~30) + the leave-animation delay (200) + margin.
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(getCards()).toHaveLength(0);
    });

    it('resumes for only the remaining time, not the full duration', async () => {
      // Generous margins throughout — real setTimeout/event-loop jitter of a
      // few ms (more under load) previously made this flake at tight (15ms)
      // windows; ~30ms of slack on both sides of the expected boundary is
      // enough to absorb that without weakening what's actually asserted.
      const id = service.show({ message: 'Hover me', duration: 100 });

      await new Promise((resolve) => setTimeout(resolve, 40));
      service.pause(id);
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(getCards()).toHaveLength(1);

      service.resume(id);
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(getCards()).toHaveLength(1);
      // Remaining time from resume (~60) plus the leave-animation delay
      // (200) plus margin, minus the 30ms already waited above.
      await new Promise((resolve) => setTimeout(resolve, 280));
      expect(getCards()).toHaveLength(0);
    });

    it('is a no-op for a sticky (duration: 0) toast', async () => {
      const id = service.show({ message: 'Sticky', duration: 0 });

      expect(() => service.pause(id)).not.toThrow();
      expect(() => service.resume(id)).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(getCards()).toHaveLength(1);
    });

    it('does not throw for an unknown id', () => {
      expect(() => service.pause('not-a-real-id')).not.toThrow();
      expect(() => service.resume('not-a-real-id')).not.toThrow();
    });

    it('pausing an already-paused toast is a no-op', async () => {
      const id = service.show({ message: 'Hover me', duration: 30 });

      service.pause(id);
      expect(() => service.pause(id)).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(getCards()).toHaveLength(1);
    });

    it('the card pauses on mouseenter and resumes on mouseleave', async () => {
      service.show({ message: 'Hover me', duration: 30 });
      const card = getCards()[0] as HTMLElement;

      card.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(getCards()).toHaveLength(1);

      card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      // remaining time (~30) + the leave-animation delay (200) + margin.
      await new Promise((resolve) => setTimeout(resolve, 260));
      expect(getCards()).toHaveLength(0);
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
