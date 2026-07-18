import { bootstrapApplication } from '@angular/platform-browser';
import { AURA_THEME_CSS } from '@dynamong/theme-aura';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// See apps/demo/src/main.ts for why this is injected in JS rather than `@import`-ed.
const themeStyleEl = document.createElement('style');
themeStyleEl.textContent = AURA_THEME_CSS;
document.head.appendChild(themeStyleEl);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
