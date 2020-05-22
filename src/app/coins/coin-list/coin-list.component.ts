import { Component, OnInit, Output, ɵEMPTY_MAP } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Coin } from '../coin';
import {
  ArgumentOutOfRangeError,
  Observable,
  EMPTY,
  BehaviorSubject,
  of,
} from 'rxjs';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { catchError, delay, findIndex, filter } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

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

  getTotal() {
    return this.coins
      .map((t) => t._amount * t.currentPrice)
      .reduce((acc, value) => acc + value, 0);
  }

  private _fetchCoins$: Observable<Coin[]>;
  filteredCoins$: Observable<Coin[]>;

  constructor(private _coinService: CoinsService, private dialog: MatDialog,
    private notificationService: NotificationService) {}

  get coinsIndividu$(): Observable<Coin[]> {
    return this._fetchCoins$;
  }

  coins: Coin[] = [];

  ngOnInit(): void {
    this._fetchCoins$ = this._coinService.allCoins$.pipe(
      catchError((err) => {
        this.errorMessage = err;
        return EMPTY;
      })
    );

    console.log(this._coinService.getCoinSymbols());
    
    this.geefPrijzen();
  }

  geefPrijzen() {
    this.coinsIndividu$.subscribe((coins) => {
      console.log(coins);
      this.coins = coins;
      for (var coin of coins) {
        this._coinService.getLiveCoinPrices(coin._name).subscribe((res) => {
          // vind de gepaste coin en pas prijs aan
          var currentCoin = coins.find((x) => x._name === Object.keys(res)[0]);
          currentCoin.currentPrice = Object.values(res)[0].EUR;

          coins.forEach((x) => {
            if (x._name === currentCoin._name && x.id !== currentCoin.id) {
              x._amount += currentCoin._amount;
              var index = coins.findIndex((x) => x.name === currentCoin.name);
              coins.splice(index, 1);
            }
          });

          this.filteredCoins$ = of(coins);
        });
      }
    });
  }

  onCreate() {
    this._coinService.initializeFormGroup();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '40%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onEdit(row) {
    console.log(row);
    this._coinService.populateForm(row);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '40%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onDelete(coin) {
    if (confirm('Are you sure you want to delete this coin?')) {
      this._coinService.deleteCoin(coin);
      this.notificationService.warn('Removed successfully!');
    }
  }
}
