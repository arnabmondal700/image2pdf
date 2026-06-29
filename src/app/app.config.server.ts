import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServerRendering } from '@angular/ssr';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(routes)
    // Note: Service worker and browser-specific providers are NOT included here
  ]
};
