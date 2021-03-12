import { Component } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
})
export class AppComponent {
  public pageTitle: string = 'CoinTracker';
  title: any;
  constructor(public auth: AuthService) {}

  opened = false;

}
