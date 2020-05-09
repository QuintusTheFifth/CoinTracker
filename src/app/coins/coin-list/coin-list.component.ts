import { Component, OnInit, Output, ɵEMPTY_MAP } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Coin } from '../coin';
import { ArgumentOutOfRangeError, Observable, EMPTY } from 'rxjs';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { catchError } from 'rxjs/operators';
import { CoinObject } from '../coinObject.model';

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

  private _coinsIndividu: Coin[];

  private _fetchCoins$:Observable<Coin[]>;

  customerTotal: number = 0;

  constructor(private _coinService: CoinsService, private dialog: MatDialog) {
  }


  // dit gebruiken?
  get coinsIndividu$(): Observable<Coin[]>{
   return this._fetchCoins$;
  }

 /*  get coins2$(): Observable<Coin[]> {
    return this.coinService.getCoinsCustomer2$;
  } */


  coinNames: any;


  newCoins: CoinObject[]=[]

  ngOnInit(): void {
    this._fetchCoins$=this._coinService.allCoins$.pipe(
      catchError(err=>{
        this.errorMessage=err;
        return EMPTY;
      })
    )
    this.coinsIndividu$.subscribe((val)=>{
     // console.log(Object.keys(val[0]));
     //this.coins=val.map(a=> new Coin(a._name,a._amount,a._priceBought,a._dateBought,a._exchange));
     this.newCoins=val.map(a=> new CoinObject(a._name,a._amount));
     console.log(this.newCoins);
     console.log(this.coinNames);
     
    });

   this.geefPrijzen();
  
  }

  geefPrijzen() {
    console.log("?")
    this.newCoins.forEach((coin)=> {
      console.log("???")
      console.log(coin.amount);
      this._coinService.getLiveCoinPrices(name).subscribe((res) => {

        // vind de gepaste coin en pas prijs aan
        var currentCoin = this.coinNames.find(
          (x) => x === Object.keys(res)[0]
        );
        currentCoin.currentPrice = Object.values(res)[0].EUR;

        // bereken totaal
        this.customerTotal += currentCoin.price * currentCoin.amount;
      });
    });
  }

  addNewCoin(newCoin: Coin) {
    this.newCoins.push(newCoin);
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
