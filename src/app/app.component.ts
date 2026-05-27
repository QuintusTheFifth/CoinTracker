import { Component, HostListener } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
})
export class AppComponent {
  public pageTitle: string = 'CoinTracker';
  constructor(public auth: AuthService) {}

  opened = false;
  navScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.navScrolled = window.scrollY > 20;
  }
}
