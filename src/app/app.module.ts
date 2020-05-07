import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import{FormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { CoinListComponent } from './coins/coin-list.component';
import { HttpClientModule } from '@angular/common/http';
import { AddCoinComponent } from './coins/add-coin.component';
import { CoinModule } from './coins/coin.module';
import { MatDialog } from '@angular/material/dialog';



@NgModule({
  declarations: [
    AppComponent,
    CoinListComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: "coin-list", component: CoinListComponent },
      { path: "", redirectTo: "coin-list", pathMatch: "full" },
      { path: "**", redirectTo: "coin-list", pathMatch: "full" },
    ]),
    CoinModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
