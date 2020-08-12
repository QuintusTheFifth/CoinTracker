import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { CoinListComponent } from './coins/coin-list/coin-list.component';
import { HttpClientModule } from '@angular/common/http';
import { CoinModule } from './coins/coin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserModule } from './user/user.module';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { MainNavComponent } from './main-nav/main-nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { httpInterceptorProviders } from './interceptors';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppRoutingModule } from './app-routing.module';
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';



// const appRoutes: Routes=[
//   { path: 'coin-list', component: CoinListComponent },
//   { path: 'register', component: RegisterComponent },
//   { path: 'login', component: LoginComponent },
//   { path: '', redirectTo: 'coin-list', pathMatch: 'full' },
//   { path: '**', component: PageNotFoundComponent },
// ];

@NgModule({
  declarations: [AppComponent, PageNotFoundComponent, MainNavComponent],
  imports: [
    RouterModule,
    MatIconModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatPaginatorModule,
    MatButtonModule,
    MatButtonToggleModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    //RouterModule.forRoot(appRoutes),
    MatDialogModule,
    MatSortModule,
    CoinModule,
    LayoutModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule,
    CoinModule,
    UserModule,
    LayoutModule,
  ],
  providers: [httpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
