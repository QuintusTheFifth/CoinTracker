import { Component, HostListener } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';
import { ThemeService, Theme } from './theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
})
export class AppComponent {
  public pageTitle: string = 'CoinTracker';
  constructor(
    public auth: AuthService,
    public themeService: ThemeService
  ) {}

  opened = false;
  navScrolled = false;

  /** True when exploring the seeded demo portfolio (no real account). */
  get isDemo(): boolean {
    return localStorage.getItem('demoMode') === '1';
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.navScrolled = window.scrollY > 20;
  }

  get themeIcon(): string {
    return this.themeService.theme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }
}
