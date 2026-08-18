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

export interface DynamoToastEntry {
  id: string;
  message: string;
  title?: string | undefined;
  severity: DynamoSeverity;
  duration: number;
  closable: boolean;
  position: DynamoToastPosition;
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

@Injectable({ providedIn: 'root' })
export class DynamoToastService {
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly idGenerator = inject(DynamoIdGenerator);
  private readonly injector = inject(Injector);

  private readonly toasts = signal<DynamoToastEntry[]>([]);
  private readonly containers = new Map<DynamoToastPosition, ContainerHandle>();

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
    };

    this.toasts.update((list) => [...list, entry]);
    this.ensureContainer(entry.position);
    this.refreshContainers();

    if (entry.duration > 0) {
      setTimeout(() => this.dismiss(entry.id), entry.duration);
    }

    return entry.id;
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
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
    this.refreshContainers();
  }

  dismissAll(): void {
    this.toasts.set([]);
    this.refreshContainers();
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
