import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCoinComponent } from './add-coin/add-coin.component';
import { RouterModule, Routes } from '@angular/router';
import {MatInputModule} from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoinListComponent } from './coin-list/coin-list.component';
import { MaterialModule } from '../material/material.module';
import { BrowserModule } from '@angular/platform-browser';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatChipsModule} from '@angular/material/chips';
import {MatTooltipModule } from '@angular/material/tooltip';
import { MatchMedia } from '@angular/flex-layout/core/typings/match-media';
import 'hammerjs';
import { HttpClientModule } from '@angular/common/http';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import{MatSnackBarModule}from '@angular/material/snack-bar';
import { EditCoinComponent } from './edit-coin/edit-coin.component';
import { AppRoutingModule } from '../app-routing.module';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/authentication/auth.service';
import { CoinGraphComponent } from './coin-graph/coin-graph.component';
import { AuthGuard } from '../authentication/auth.guard';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

const routes: Routes = [
  { path: 'coin-list', component: CoinListComponent,
  canActivate:[AuthGuard]
 },
  { path: 'edit-coin', component: EditCoinComponent,
  canActivate:[AuthGuard] 
},
{ path: 'coin-graph', component: CoinGraphComponent,
canActivate:[AuthGuard] 
},
];


@NgModule({
  declarations: [
    AddCoinComponent,
    CoinListComponent,
    EditCoinComponent,
    CoinGraphComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    MatButtonToggleModule,
    MatButtonModule,
    CommonModule,
    MatTooltipModule,
    MaterialModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatInputModule,
    BrowserAnimationsModule,
    BrowserModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    MatGridListModule,
    MatChipsModule,
    HttpClientModule,
    MatTableModule,
    MatAutocompleteModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: MatDialogRef,
      useValue: {}
    },
 ],
  entryComponents:[AddCoinComponent]
})
export class CoinModule { }
