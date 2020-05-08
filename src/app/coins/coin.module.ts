import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCoinComponent } from './add-coin/add-coin.component';
import { RouterModule } from '@angular/router';
import {MatInputModule} from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoinListComponent } from './coin-list/coin-list.component';
import { MaterialModule } from '../material/material.module';
import { BrowserModule } from '@angular/platform-browser';
import{MatDialogModule, MatDialog,MatDialogRef} from '@angular/material/dialog';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatChipsModule} from '@angular/material/chips';
import {MatTooltipModule } from '@angular/material/tooltip';
import { MatchMedia } from '@angular/flex-layout/core/typings/match-media';
import 'hammerjs';


@NgModule({
  declarations: [
    AddCoinComponent,
    CoinListComponent
  ],
  imports: [
    RouterModule.forChild([
      {path:"coin-add",component:AddCoinComponent}
    ]),
    CommonModule,
    MatTooltipModule,
    MaterialModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    BrowserAnimationsModule,
    BrowserModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    MatGridListModule,
    MatChipsModule
  ],
  entryComponents:[AddCoinComponent]
})
export class CoinModule { }
