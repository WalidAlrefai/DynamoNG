import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DynamoFocusTrapService } from './focus-trap.service';

describe('DynamoFocusTrapService', () => {
  let service: DynamoFocusTrapService;
  let container: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(DynamoFocusTrapService);

    container = document.createElement('div');
    container.innerHTML = `<button id="first">First</button><button id="second">Second</button>`;
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates a focus trap for the given element without throwing', () => {
    expect(() => service.create(container)).not.toThrow();
  });

  it('returns a focus trap exposing the CDK focus-trap API', () => {
    const trap = service.create(container);

    expect(typeof trap.focusInitialElement).toBe('function');
    expect(typeof trap.destroy).toBe('function');

    trap.destroy();
  });
});
