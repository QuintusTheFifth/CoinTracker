import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCoinComponent } from './add-coin/add-coin.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoinListComponent } from './coin-list/coin-list.component';
import { MaterialModule } from '../material/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import 'hammerjs';
import { HttpClientModule } from '@angular/common/http';
import { EditCoinComponent } from './edit-coin/edit-coin.component';
import { CoinGraphComponent } from './coin-graph/coin-graph.component';

@NgModule({
  declarations: [
    AddCoinComponent,
    CoinListComponent,
    EditCoinComponent,
    CoinGraphComponent,
  ],
  imports: [
    RouterModule,
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    {
      provide: MatDialogRef,
      useValue: {},
    },
  ],
  entryComponents: [AddCoinComponent],
})
export class CoinModule {}
