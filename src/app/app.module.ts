import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import{FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { CoinListComponent } from './coins/coin-list/coin-list.component';
import { HttpClientModule } from '@angular/common/http';
import { CoinModule } from './coins/coin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserModule } from './user/user.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      { path: "coin-list", component: CoinListComponent },
      { path: "", redirectTo: "coin-list", pathMatch: "full" },
      { path: "**", redirectTo: "coin-list", pathMatch: "full" },
    ]),
    CoinModule,
    UserModule,
    
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
