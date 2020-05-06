import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ICoin, Coin } from './coin';
import { CoinService } from './coin.service';
import { ArgumentOutOfRangeError } from 'rxjs';

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

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
      amount: 25,
      exchange: null,
      date: null,
      total:0.1889*2000
    },
    {
      id: 2,
      coinName: 'BNB',
      price: 15.45,
      amount: 2000,
      exchange: null,
      date: null,
      total: 15.45*25
    },
  ];

  constructor(
    private coinService: CoinService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.coinService.getCoins().subscribe({
      next: coins => {
        this.coins=coins
        this.filteredCoins=this.coins;
      },
      error: err =>this.errorMessage = err
    });
    this.filteredCoins=this.coins;
  }

  performFilter(filterBy: string): ICoin[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.coins.filter(
      (coin: ICoin) =>
        coin.coinName.toLocaleLowerCase().indexOf(filterBy) !== -1
    );
  }
}
