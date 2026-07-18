import { provideZonelessChangeDetection, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach } from 'vitest';
import { provideDynamoNG, type DynamoConfigOptions } from '@dynamong/core/config';

/** Unwraps `input()` signal properties (callable, no args) to their value type; leaves everything else as-is. */
type UnwrapInputs<T> = { [K in keyof T]?: T[K] extends () => infer V ? V : T[K] };

export interface RenderDynamoComponentOptions<T> {
  /** Initial values for the component's `input()` properties. */
  inputs?: UnwrapInputs<T>;
  /** Extra providers merged alongside DynamoNG's standard test providers. */
  providers?: (Provider | EnvironmentProviders)[];
  /** Options forwarded to `provideDynamoNG()`. Defaults to the built-in config. */
  dynamoConfig?: DynamoConfigOptions;
}

export interface RenderDynamoComponentResult<T> {
  fixture: ComponentFixture<T>;
  /** The component's root DOM element (`fixture.nativeElement`), attached to `document.body`. */
  container: HTMLElement;
  componentInstance: T;
  /** Re-applies `inputs` and calls `fixture.detectChanges()` — the "rerender" step. */
  setInputs(inputs: UnwrapInputs<T>): void;
}

const attachedElements: HTMLElement[] = [];

afterEach(() => {
  for (const element of attachedElements.splice(0)) {
    element.remove();
  }
});

/**
 * Creates and renders a component with DynamoNG's standard test-bed setup
 * already wired in (zoneless change detection + global config), using
 * Angular's own `TestBed`/`ComponentRef.setInput` APIs directly rather than a
 * higher-level render library, so component specs have one stable, minimal
 * surface to depend on.
 *
 * The rendered element is attached to `document.body` (and removed after each
 * test) because CDK's interactivity/focus-trap checks require a connected,
 * visible element to find focusable candidates — a detached fixture makes
 * every element in it look unfocusable.
 */
export function renderDynamoComponent<T>(
  component: Type<T>,
  options: RenderDynamoComponentOptions<T> = {},
): RenderDynamoComponentResult<T> {
  const { inputs, providers = [], dynamoConfig } = options;

  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideDynamoNG(dynamoConfig), ...providers],
  });

  const fixture = TestBed.createComponent(component);
  const container = fixture.nativeElement as HTMLElement;
  document.body.appendChild(container);
  attachedElements.push(container);

  const setInputs = (values: UnwrapInputs<T>): void => {
    for (const [key, value] of Object.entries(values as object)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    // Flushes constructor-registered effect() callbacks synchronously — under
    // TestBed these don't always run as part of detectChanges() alone, which
    // matters for components (like DynamoDialog) that react to input changes
    // via effect() rather than a template binding.
    TestBed.flushEffects();
  };

  if (inputs) {
    setInputs(inputs);
  } else {
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  return {
    fixture,
    container,
    componentInstance: fixture.componentInstance,
    setInputs,
  };
}
