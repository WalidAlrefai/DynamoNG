import {
  ComponentRef,
  Injectable,
  Injector,
  inject,
  signal,
} from '@angular/core';
import type { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DynamoIdGenerator } from '@dynamong/core/a11y';
import { DynamoOverlayService } from '@dynamong/core/overlay';
import type { DynamoSeverity } from '@dynamong/core/api';
import { DynamoToastContainer } from './toast-container';
import type { DynamoToastOptions, DynamoToastPosition } from './toast.types';

/** `'entering'`/`'leaving'` drive the enter/exit transition; `'visible'` is the steady state in between. Each toast animates independently since several can be entering/visible/leaving at once. */
export type DynamoToastPhase = 'entering' | 'visible' | 'leaving';

export interface DynamoToastEntry {
  id: string;
  message: string;
  title?: string | undefined;
  severity: DynamoSeverity;
  duration: number;
  closable: boolean;
  position: DynamoToastPosition;
  phase: DynamoToastPhase;
}

const MARGIN = '1rem';

function applyGlobalPosition(
  strategy: GlobalPositionStrategy,
  position: DynamoToastPosition,
): void {
  switch (position) {
    case 'top-right':
      strategy.top(MARGIN).right(MARGIN);
      break;
    case 'top-left':
      strategy.top(MARGIN).left(MARGIN);
      break;
    case 'bottom-right':
      strategy.bottom(MARGIN).right(MARGIN);
      break;
    case 'bottom-left':
      strategy.bottom(MARGIN).left(MARGIN);
      break;
    case 'top-center':
      strategy.top(MARGIN).centerHorizontally();
      break;
    case 'bottom-center':
      strategy.bottom(MARGIN).centerHorizontally();
      break;
  }
}

interface ContainerHandle {
  overlayRef: OverlayRef;
  componentRef: ComponentRef<DynamoToastContainer>;
}

/**
 * Tracks one toast's auto-dismiss countdown across pause/resume cycles.
 * `timeoutId` is `undefined` while paused (hovered) — `remainingMs` then
 * holds whatever was left when the pause started, so `resume()` restarts a
 * fresh `setTimeout` for exactly that long rather than the full duration.
 */
interface TimerState {
  timeoutId: ReturnType<typeof setTimeout> | undefined;
  remainingMs: number;
  startedAt: number;
}

@Injectable({ providedIn: 'root' })
export class DynamoToastService {
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly idGenerator = inject(DynamoIdGenerator);
  private readonly injector = inject(Injector);

  // Must stay in sync with `duration-200` in toastCardStyles.
  private static readonly LEAVE_DURATION_MS = 200;

  private readonly toasts = signal<DynamoToastEntry[]>([]);
  private readonly containers = new Map<DynamoToastPosition, ContainerHandle>();
  private readonly timers = new Map<string, TimerState>();
  private readonly leaveTimeouts = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  /** Read-only signal of every currently-visible toast, across all positions — consumed by `DynamoToastContainer`. */
  readonly allToasts = this.toasts.asReadonly();

  show(options: DynamoToastOptions): string {
    const entry: DynamoToastEntry = {
      id: this.idGenerator.next('dg-toast'),
      message: options.message,
      title: options.title,
      severity: options.severity ?? 'info',
      duration: options.duration ?? 5000,
      closable: options.closable ?? true,
      position: options.position ?? 'top-right',
      phase: 'entering',
    };

    this.toasts.update((list) => [...list, entry]);
    this.ensureContainer(entry.position);
    this.refreshContainers();

    // Double rAF, not single — same reasoning as Drawer's beginOpen: a
    // single callback can still run before the browser has committed a
    // paint at the entering transform, coalescing the two states and
    // skipping the transition. Re-checks the phase in case dismiss() ran
    // first (a near-instant programmatic dismiss).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.toasts.update((list) =>
          list.map((toast) =>
            toast.id === entry.id && toast.phase === 'entering'
              ? { ...toast, phase: 'visible' }
              : toast,
          ),
        );
        this.refreshContainers();
      });
    });

    if (entry.duration > 0) {
      this.startTimer(entry.id, entry.duration);
    }

    return entry.id;
  }

  /** Pauses a toast's auto-dismiss countdown — called on pointer hover. A no-op for a sticky (`duration: 0`) toast or one already paused. */
  pause(id: string): void {
    const timer = this.timers.get(id);
    if (!timer?.timeoutId) {
      return;
    }
    clearTimeout(timer.timeoutId);
    const elapsed = Date.now() - timer.startedAt;
    timer.timeoutId = undefined;
    timer.remainingMs = Math.max(0, timer.remainingMs - elapsed);
  }

  /** Resumes a paused toast's countdown for whatever time was left when it was paused. */
  resume(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.timeoutId || timer.remainingMs <= 0) {
      return;
    }
    this.startTimer(id, timer.remainingMs);
  }

  private startTimer(id: string, ms: number): void {
    const timeoutId = setTimeout(() => this.dismiss(id), ms);
    this.timers.set(id, { timeoutId, remainingMs: ms, startedAt: Date.now() });
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer?.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
    this.timers.delete(id);
  }

  success(
    message: string,
    options?: Omit<DynamoToastOptions, 'message' | 'severity'>,
  ): string {
    return this.show({ ...options, message, severity: 'success' });
  }

  info(
    message: string,
    options?: Omit<DynamoToastOptions, 'message' | 'severity'>,
  ): string {
    return this.show({ ...options, message, severity: 'info' });
  }

  warning(
    message: string,
    options?: Omit<DynamoToastOptions, 'message' | 'severity'>,
  ): string {
    return this.show({ ...options, message, severity: 'warning' });
  }

  error(
    message: string,
    options?: Omit<DynamoToastOptions, 'message' | 'severity'>,
  ): string {
    return this.show({ ...options, message, severity: 'danger' });
  }

  dismiss(id: string): void {
    this.clearTimer(id);

    const existing = this.toasts().find((toast) => toast.id === id);
    if (!existing || existing.phase === 'leaving') {
      return;
    }

    this.toasts.update((list) =>
      list.map((toast) =>
        toast.id === id ? { ...toast, phase: 'leaving' } : toast,
      ),
    );
    this.refreshContainers();

    const timeoutId = setTimeout(() => {
      this.toasts.update((list) => list.filter((toast) => toast.id !== id));
      this.refreshContainers();
      this.leaveTimeouts.delete(id);
    }, DynamoToastService.LEAVE_DURATION_MS);
    this.leaveTimeouts.set(id, timeoutId);
  }

  /** Dismisses every visible toast, animating each one out individually rather than clearing them instantly. */
  dismissAll(): void {
    for (const toast of this.toasts()) {
      this.dismiss(toast.id);
    }
  }

  private ensureContainer(position: DynamoToastPosition): void {
    if (this.containers.has(position)) {
      return;
    }

    const overlayRef = this.overlayService.createGlobalOverlay((strategy) =>
      applyGlobalPosition(strategy, position),
    );
    const componentRef = overlayRef.attach(
      new ComponentPortal(DynamoToastContainer, null, this.injector),
    );
    componentRef.setInput('position', position);

    this.containers.set(position, { overlayRef, componentRef });
  }

  // The container's `toasts` computed() depends on this service's own
  // signal, but Angular's zoneless scheduler doesn't refresh an
  // already-created ComponentPortal's view synchronously with a signal
  // write — so every mutation explicitly ticks CD for every mounted
  // container, keeping toasts visible/removed the instant show()/dismiss()
  // returns rather than on some later microtask.
  private refreshContainers(): void {
    for (const handle of this.containers.values()) {
      handle.componentRef.changeDetectorRef.detectChanges();
    }
  }
}
