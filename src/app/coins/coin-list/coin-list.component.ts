import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

export interface PeriodicElement {
  symbol: string;
  price: number;
  amount: number;
  total: number;
}

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
  selector: 'coin-list',
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

  displayedColumns: string[] = [
    'symbol',
    'amount',
    'price',
    'change',
    'transactions',
    'graph',
    'total',
    'buttons',
  ];
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  message: string;

  getTotal() {
    var total = 0;
    this.total.forEach((p) => {
      if (!isNaN(p)) {
        //
        total += p;
      }
    });
    //
    return total;
  }

  total = [];
  addToTotal(amount, price) {
    var totalPrice = amount * price;
    //
    this.total.push(totalPrice);
    //
  }

  allCoins: any[];

  dataSource = new MatTableDataSource(this.allCoins);

  constructor(
    public _coinService: CoinsService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this._coinService.currentValuta.subscribe(
      (valuta) => (this.valuta = valuta)
    );
  }

  price: any;
  key = 'e1d125c0-d5ed-4165-85eb-ddc177c4f134';
  ngOnInit(): void {
    //this.geefPrijzen();
    this.geefCoins();
    //
    this.dataSource.sort = this.sort;
    // this.marketcap=this.getTotalMarketCap();
    this._coinService.currentCoinSymbol.subscribe(
      (message) => (this.message = message)
    );

    this._coinService.changeCoinSymbol('');
    this._coinService.changeBigChart(false);

    
  }

  valuta;

  marketcap;
  prices = [];
  priceLive = '';

  // getTotalMarketCap() {
  //   return this._coinService.getTotalMarketCap();
  // }

  berekenEindTotaal(lijstCoins) {
    //
    var eindTotal = 0;

    for (var coin of lijstCoins) {
      var total = 0;
      var price = this.geefCoinPrice(coin.symbol, this.prices);

      var amount = coin.amount;

      total = amount * price;
      eindTotal += total;
    }

    return eindTotal;
  }

  geefCoins() {
    this._coinService.allCoins$.subscribe((allCoins) => {
      this._coinService.setCoins(allCoins);

      this.allCoins = this.getUnique(
        //Geeft coins met zelfde "symbol" gelijke 'amount'
        allCoins.map((c) => {
          const coin = {
            id: c.id,
            symbol: c.name,
            amount: c.amount,
            //$key: c.key
            transactions: 0,
          };

          //
          coin.amount = 0;
          for (let item of allCoins) {
            if (coin.symbol === item.name) {
              coin.amount += item.amount;
              coin.transactions += 1;
            }
          }
          return coin;
        }),
        'symbol'
      );

      this.allCoins.sort((a, b) => a.symbol.localeCompare(b.symbol));

      for (var coin of this.allCoins) {
        this.geefPrijs(coin.symbol);
        coin.price = this.geefCoinPrice(coin.symbol, this.prices);
      }
    });
  }

  geefCoinPrice(name, array) {
    var result = array.find((obj) => obj.name === name);
    if (result !== undefined) {
      //
      return result.price;
    }
  }

  geefOldCoinPrice(name, array) {
    var result = array.find((obj) => obj.name == name);
    if (result !== undefined) {
      return result.oldPrice;
    }
  }

  public getColor(price: number): string {
    return price > 0 ? 'green' : 'red';
  }

  //vormt array van objecten om naar een array van unieke objecten
  getUnique(arr, comp) {
    // store the comparison  values in array
    const unique = arr
      .map((e) => e[comp])

      // store the indexes of the unique objects
      .map((e, i, final) => final.indexOf(e) === i && i)

      // eliminate the false indexes & return unique objects
      .filter((e) => arr[e])
      .map((e) => arr[e]);

    return unique;
  }

  value;
  geefPrijs(coinSymbol: string) {
    var coin = {
      price: 0,
      name: '',
      oldPrice: 0,
      changeBool: 1,
      percent:0
    };

    this._coinService.dailyChange(coinSymbol).subscribe((val: any) => {
      coin.oldPrice = val.Data['Data'][0].open;
    });

    this._coinService.getCoinPrice(coinSymbol).subscribe((val: any) => {
      coin.name = coinSymbol;
      coin.price = val[coinSymbol][this.valuta];
      coin.percent=((coin.price-coin.oldPrice)/coin.oldPrice)*100;

      if (coin.price - coin.oldPrice < 0) {
        coin.changeBool = -1;
      }

      this.prices.push(coin);

      return val[coinSymbol][this.valuta];
    });
  }

  changeCoinSymbol(coinsymbol: string) {
    this._coinService.changeCoinSymbol(coinsymbol);
  }

  getChange(name, array) {
    var result = array.find((obj) => obj.name == name)
    return result.percent
  }

  onCreate() {
    this._coinService.initializeFormGroup();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '30%';
    dialogConfig.height = '45%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onEdit(coinSymbol) {
    this._coinService.changeCoinSymbol(coinSymbol);
    this.router.navigateByUrl('edit-coin');
  }

  onDelete(coin) {
    if (confirm('Are you sure you want to delete this coin?')) {
      this._coinService.deleteCoins(coin);
      // this.router
      // .navigateByUrl('edit-coin', { skipLocationChange: true })
      // .then(() => {
      //   this.router.navigate(['coin-list']);
      // });
      // this.notificationService.warn('Removed successfully!');
    }
  }

  changeValuta(valuta) {
    this._coinService.changeValuta(valuta);
    this.router
      .navigateByUrl('edit-coin', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['coin-list']);
      });
  }
}
