import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Pipe, PipeTransform } from '@angular/core';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { NotificationService } from '../services/notification.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';

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
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  priceChange$ = new BehaviorSubject<Record<string, string>>({});

  message: string;
  change: true;

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
    private notificationService: NotificationService,
    private router: Router
  ) {
    this._coinService.addCoinsToList();
    this._coinService.currentValuta.subscribe(
      (valuta) => (this.valuta = valuta)
    );
  }

  price: any;
  ngOnInit(): void {
    this.geefCoins();
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this._coinService.currentMessage.subscribe(
      (message) => (this.message = message)
    );
    this._coinService.changeMessage('');
    this._coinService.changeBigChart(false);
  }

  valuta;

  marketcap;
  prices = [];
  priceLive = '';

  berekenEindTotaal(lijstCoins) {
    //
    var eindTotal = 0;

    for (var coin of lijstCoins) {
      var total = 0;
      var price = coin.price;

      var amount = coin.amount;

      total = amount * price;
      eindTotal += total;
    }
    return eindTotal;
  }
  prijs;

  geefCoins() {
    this._coinService.getCoins().subscribe((allCoins) => {
      this.allCoins = this.getUnique(
        //Geeft coins met zelfde "symbol" gelijke 'amount'
        allCoins.map((c) => {
          const coin = {
            symbol: c.symbol,
            amount: c.amount,
            //$key: c.key
            price: 0,
            transactions: 0,
          };
          //
          coin.amount = 0;
          for (let item of allCoins) {
            if (coin.symbol === item.symbol) {
              coin.amount += item.amount;
              coin.transactions += 1;
            }
          }
          return coin;
        }),
        'symbol'
      );

      this.allCoins.sort((a, b) => a.symbol.localeCompare(b.symbol));
      this.dataSource.data = this.allCoins;

      for (var coin of this.allCoins) {
        this.geefPrijs(coin);
      }
    });
  }

  grandTotal=0

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
  geefPrijs(coin) {
    forkJoin({
      oldPrice: this._coinService.dailyChange(coin.symbol).pipe(
        map((val: any) => val.Data.Data[0].open)
      ),
      price: this._coinService.getCoinPrice(coin.symbol).pipe(
        map((val: any) => val[coin.symbol][this.valuta])
      )
    }).subscribe(({ oldPrice, price }) => {
      coin.price = price;
      coin.oldPrice = oldPrice;
      const percent = (((price - oldPrice) / oldPrice) * 100).toFixed(2);
      this.priceChange$.next({
        ...this.priceChange$.value,
        [coin.symbol]: percent
      });
    });
  }
  onCreate() {
    this._coinService.initializeFormGroup();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '90vw';
    dialogConfig.width = window.innerWidth < 600 ? '90vw' : '400px';
    dialogConfig.maxHeight = '90vh';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onEdit(coinSymbol) {
    this._coinService.changeMessage(coinSymbol);
    this.router.navigateByUrl('edit-coin');
  }

  onDelete(coin) {
    if (confirm('Are you sure you want to delete this coin?')) {
      this._coinService.deleteCoin(coin);
      this.notificationService.warn('Removed successfully!');
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
