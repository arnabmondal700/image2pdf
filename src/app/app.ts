import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/app-header/app-header.component';

/**
 * Root application component - Shell for tool-based architecture
 * Provides the ambient background, glass card container, and header navigation
 * that wraps all routed tool components.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent
  ],
  template: `
    <main class="app-shell">
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>

      <section class="app-card">
        <app-header></app-header>

        <router-outlet></router-outlet>
      </section>
    </main>
  `,
  styleUrls: ['./app.scss']
})
export class App {
  constructor() {}
}