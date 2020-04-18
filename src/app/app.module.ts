import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: "home", component: HomeComponent },
      { path: "", redirectTo: "home", pathMatch: "full" },
      { path: "**", redirectTo: "home", pathMatch: "full" },
    ]),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
