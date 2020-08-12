import { Component } from '@angular/core';
import { AuthenticationService } from './user/authentication.service';
import { CoinsService } from './coins/services/coin.data.service';

@Component({
  selector: 'app-root',
  templateUrl:'app.component.html',
  styleUrls:['app.component.css']
})
export class AppComponent {
  
  constructor(public auth:AuthenticationService, public coinservice:CoinsService
    ){
      
    }
  public pageTitle: string= "CoinTracker";
  title: any;
  opened = false;

}
