import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import { ICoin, Coin } from './coin';

@Component({
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css']
})
export class AddCoinComponent implements OnInit {

  PageTitle:string="Add a holding";
  
  constructor(
  ) { }

  _listFilter = '';
  get listFilter(): string {
    return this._listFilter;
  }

  set listFilter(value: string) {
    this._listFilter = value;
    this.filteredCoins = this.listFilter
      ? this.performFilter(this.listFilter)
      : this.coins;
  }

  filteredCoins: ICoin[];
  coins: Coin[] = [
    {
      id: 1,
      coinName: 'XRP',
      price: 0.1889,
      amount: 2000,
      exchange: null,
      date: null,
      total:0.1889*2000
    },
    {
      id: 2,
      coinName: 'BNB',
      price: 15.45,
      amount: 25,
      exchange: null,
      date: null,
      total: 15.45*25
    },
  ];

  performFilter(filterBy: string): ICoin[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.coins.filter(
      (coin: ICoin) =>
        coin.coinName.toLocaleLowerCase().indexOf(filterBy) !== -1
    );
  }

  ngOnInit(): void {
  }

}
