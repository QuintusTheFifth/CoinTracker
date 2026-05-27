import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cointracker_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private _theme = new BehaviorSubject<Theme>('dark');
  theme$ = this._theme.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.init();
  }

  private init(): void {
    // 1. Check stored preference
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      this.apply(stored);
      return;
    }

    // 2. Auto-detect: time-based (6AM-6PM = light, 6PM-6AM = dark)
    const hour = new Date().getHours();
    const timeTheme: Theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    this.apply(timeTheme);
  }

  get theme(): Theme {
    return this._theme.value;
  }

  toggle(): void {
    const next: Theme = this._theme.value === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  set(theme: Theme): void {
    this.apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private apply(theme: Theme): void {
    if (theme === 'light') {
      this.renderer.addClass(document.body, 'light-theme');
    } else {
      this.renderer.removeClass(document.body, 'light-theme');
    }
    this._theme.next(theme);
  }
}
