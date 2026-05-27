import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCoinComponent } from './add-coin/add-coin.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoinListComponent } from './coin-list/coin-list.component';
import { MaterialModule } from '../material/material.module';
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
    FormsModule,
  ],
})
export class CoinModule {}
