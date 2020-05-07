import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ICoin, Coin } from './coin';
import { ArgumentOutOfRangeError } from 'rxjs';
import { AddCoinComponent } from './add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from './services/coins.service';

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

  constructor(
    private coinService: CoinsService,
    private route: ActivatedRoute
  ) {}

  //   openDialog(){
  //   this.dialog.open(AddCoinComponent);

  // }

  /* _listFilter = '';
  get listFilter(): string {
    return this._listFilter;
  }
  set listFilter(value: string) {
    this._listFilter = value;
    this.filteredCoins = this.listFilter
      ? this.performFilter(this.listFilter)
      : this.coins;
  } */
  objectKeys = Object.keys;
  cryptos: any;

  filteredCoins: ICoin[];
  coins: Coin[] = [
    {
      id: 1,
      coinName: 'XRP',
      price: null,
      amount: 2000,
      exchange:"",
      date:null,
      total:0
    },
    {
      id: 2,
      coinName: 'BNB',
      price: null,
      amount: 25,
      date:null,
      exchange:"",
      total:0
    },
    {
      id: 2,
      coinName: 'BTC',
      price: null,
      amount: 0.4,
      date:null,
      exchange:"",
      total:0
    }
  ];

  number = 0;
  newList;

  ngOnInit(): void {
    for (var coin of this.coins) {
      this.coinService.getPrice(coin.coinName).subscribe((res) => {

        console.log(Object.values(res)[0].EUR);
        console.log(Object.keys(res)[0])
        
        // vind de gepaste coin en pas prijs aan
        this.coins.find(x=>x.coinName===Object.keys(res)[0]).price=Object.values(res)[0].EUR

        console.log(this.number);
      });
    }
    console.log(this.coins);

    /* this.coinService.getCoins().subscribe({
      next: coins => {
        this.coins=coins
        this.filteredCoins=this.coins;
      },
      error: err =>this.errorMessage = err
    }); */

    this.filteredCoins = this.coins;
  }

  /* performFilter(filterBy: string): ICoin[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.coins.filter(
      (coin: ICoin) =>
        coin.coinName.toLocaleLowerCase().indexOf(filterBy) !== -1
    );
  } */

  timeout() {
    var that = this;
    setTimeout(function () {
      console.log('Test');
      that.timeout();
    }, 1000 / 60);
  }
}
