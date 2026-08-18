import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DynamoOverlayService } from './overlay.service';

describe('DynamoOverlayService', () => {
  let service: DynamoOverlayService;
  let origin: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(DynamoOverlayService);

    origin = document.createElement('button');
    document.body.appendChild(origin);
  });

  afterEach(() => {
    origin.remove();
  });

  it('creates an overlay handle exposing an OverlayRef and a position strategy', () => {
    const handle = service.createConnectedOverlay(origin, [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      },
    ]);

    expect(typeof handle.overlayRef.attach).toBe('function');
    expect(typeof handle.overlayRef.dispose).toBe('function');
    expect(typeof handle.positionStrategy.withPositions).toBe('function');

    handle.overlayRef.dispose();
  });

  it('does not attach the overlay by default', () => {
    const handle = service.createConnectedOverlay(origin, [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      },
    ]);

    expect(handle.overlayRef.hasAttached()).toBe(false);

    handle.overlayRef.dispose();
  });
});
