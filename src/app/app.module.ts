import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import{FormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { CoinListComponent } from './coins/coin-list.component';
import { HttpClientModule } from '@angular/common/http';

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
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
