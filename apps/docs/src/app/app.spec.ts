import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideDynamoNG } from '@dynamong/core/config';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideDynamoNG(),
        provideRouter(appRoutes),
      ],
    }).compileComponents();
  });

  it('renders the sidebar nav with a link per registered component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('nav a');
    // 1 home link + 46 component links.
    expect(links).toHaveLength(47);
  });
});
