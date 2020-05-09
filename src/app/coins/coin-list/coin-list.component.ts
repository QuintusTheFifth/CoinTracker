import { Component, OnInit, Output, ɵEMPTY_MAP } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Coin } from '../coin';
import {
  ArgumentOutOfRangeError,
  Observable,
  EMPTY,
  BehaviorSubject,
} from 'rxjs';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { catchError, delay, findIndex, filter } from 'rxjs/operators';

export interface PeriodicElement {
  symbol: string;
  price: number;
  amount: number;
  total: number;
}

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

  displayedColumns: string[] = [
    'symbol',
    'price',
    'amount',
    'total',
    'buttons',
  ];

  private _fetchCoins$: Observable<Coin[]>;
  filteredCoins$: Coin[];

  customerTotal: number = 0;

  constructor(private _coinService: CoinsService, private dialog: MatDialog) {}

  get coinsIndividu$(): Observable<Coin[]> {
    return this._fetchCoins$;
  }

  coins: Coin[] = [];

  coinNames: any;

  ngOnInit(): void {
    this._fetchCoins$ = this._coinService.allCoins$.pipe(
      catchError((err) => {
        this.errorMessage = err;
        return EMPTY;
      })
    );

    console.log(this.coinsIndividu$);

    this.geefPrijzen();
  }

  geefPrijzen() {
    this.coinsIndividu$.subscribe((coins) => {
      this.coins = coins;
      console.log(coins);
      for (var coin of coins) {
        console.log(coin._name);
        this._coinService.getLiveCoinPrices(coin._name).subscribe((res) => {
          console.log(Object.keys(res)[0]);

          // vind de gepaste coin en pas prijs aan
          var currentCoin = coins.find((x) => x._name === Object.keys(res)[0]);
          currentCoin.currentPrice = Object.values(res)[0].EUR;

          coins.forEach((x) => {
            if (x._name === currentCoin._name && x.id !== currentCoin.id) {
              x._amount += currentCoin._amount;
              var index = coins.findIndex((x) => x.name === currentCoin.name);
              coins.splice(index, 1);
              this.filteredCoins$ = coins;
            }
          });

          // bereken totaal
          this.customerTotal += (currentCoin.price * currentCoin.amount);
        });
      }
      console.log(this.coins);
    });
  }

  addNewCoin(newCoin: Coin) {
    this.coins.push(newCoin);
    this.geefPrijzen();
    this.customerTotal += newCoin.amount * newCoin.price;
  }

  onCreate() {
    this._coinService.initializeFormGroup();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '40%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onEdit(coin) {}
}
