import {
  Overlay,
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategyOrigin,
  type OverlayConfig,
  type OverlayRef,
  type FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';

export interface DynamoOverlayHandle {
  readonly overlayRef: OverlayRef;
  readonly positionStrategy: FlexibleConnectedPositionStrategy;
}

/**
 * Thin wrapper around the CDK's `Overlay` service, kept as DynamoNG's own
 * injectable so overlay components (tooltip, ...) depend on a DynamoNG
 * abstraction rather than importing `@angular/cdk/overlay` directly
 * everywhere it's needed.
 */
@Injectable({ providedIn: 'root' })
export class DynamoOverlayService {
  private readonly overlay = inject(Overlay);

  /** Creates (but does not attach) an overlay flexibly connected to `origin`. */
  createConnectedOverlay(
    origin: FlexibleConnectedPositionStrategyOrigin,
    positions: ConnectedPosition[],
    config: Partial<OverlayConfig> = {},
  ): DynamoOverlayHandle {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8);

    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition({
        scrollThrottle: 20,
      }),
      ...config,
    });

    return { overlayRef, positionStrategy };
  }
}
