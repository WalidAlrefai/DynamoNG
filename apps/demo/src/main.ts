import { bootstrapApplication } from '@angular/platform-browser';
import { AURA_THEME_CSS } from '@dynamong/theme-aura';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Injects the compiled `--dg-*` custom-properties stylesheet for the Aura theme.
// (A real consumer app would instead `@import "@dynamong/theme-aura/theme.css";`
// once that prebuilt asset ships — see the root README's "known simplifications".)
const themeStyleEl = document.createElement('style');
themeStyleEl.textContent = AURA_THEME_CSS;
document.head.appendChild(themeStyleEl);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
