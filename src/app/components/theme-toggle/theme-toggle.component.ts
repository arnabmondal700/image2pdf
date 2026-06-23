import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <div class="theme-toggle" role="radiogroup" aria-label="Theme selection">
      <button
        class="theme-btn"
        [class.active]="theme.isLight()"
        (click)="theme.setTheme('light')"
        type="button"
        aria-label="Light theme"
        title="Light theme"
      >
        <i class="fa-solid fa-sun"></i>
      </button>
      <button
        class="theme-btn"
        [class.active]="theme.isDark()"
        (click)="theme.setTheme('dark')"
        type="button"
        aria-label="Dark theme"
        title="Dark theme"
      >
        <i class="fa-solid fa-moon"></i>
      </button>
      <button
        class="theme-btn"
        [class.active]="theme.isSystem()"
        (click)="theme.setTheme('system')"
        type="button"
        aria-label="System theme"
        title="System theme"
      >
        <i class="fa-solid fa-desktop"></i>
      </button>
    </div>
  `,
  styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}