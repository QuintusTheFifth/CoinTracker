import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { CoinModule } from './coins/coin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LayoutModule } from '@angular/cdk/layout';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';

import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';

import { MatSortModule } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './user/login/login.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';

@NgModule({
  declarations: [AppComponent, PageNotFoundComponent, LoginComponent],
  imports: [
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
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    ReactiveFormsModule,
    AppRoutingModule,
    RouterModule,
    MatIconModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
