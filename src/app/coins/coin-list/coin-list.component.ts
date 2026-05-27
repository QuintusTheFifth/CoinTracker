import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Pipe, PipeTransform } from '@angular/core';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coin.data.service';
import { NotificationService } from '../services/notification.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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
export class CoinListComponent implements OnInit, OnDestroy, AfterViewInit {
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
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  priceChange$ = new BehaviorSubject<Record<string, string>>({});

  message: string;

  allCoins: any[] = [];

  dataSource = new MatTableDataSource<any>([]);

  private destroy$ = new Subject<void>();

  constructor(
    public _coinService: CoinsService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this._coinService.addCoinsToList();
    this._coinService.currentValuta.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (valuta) => (this.valuta = valuta)
    );
  }

  price: any;
  ngOnInit(): void {
    this.geefCoins();
    this.dataSource.sort = this.sort;
    this._coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (message) => (this.message = message)
    );
    this._coinService.changeMessage('');
    this._coinService.changeBigChart(false);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  valuta;

  marketcap;
  prices = [];
  priceLive = '';

  // Value-weighted 24h portfolio change (%), from per-symbol change data.
  portfolioChange(changes: Record<string, string>): number {
    if (!this.allCoins || !changes) { return 0; }
    let totalValue = 0;
    let weighted = 0;
    for (const coin of this.allCoins) {
      const value = (coin.amount || 0) * (coin.price || 0);
      const pct = parseFloat(changes[coin.symbol]);
      if (!isNaN(pct) && value > 0) {
        totalValue += value;
        weighted += value * pct;
      }
    }
    return totalValue ? weighted / totalValue : 0;
  }

  totalCost(): number {
    if (!this.allCoins) { return 0; }
    return this.allCoins.reduce((sum, c) => sum + (c.cost || 0), 0);
  }

  // All-time return = current value − cost basis.
  plAbsolute(): number {
    return this.berekenEindTotaal(this.allCoins) - this.totalCost();
  }

  plPercent(): number {
    const cost = this.totalCost();
    return cost ? (this.plAbsolute() / cost) * 100 : 0;
  }

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
    // Auto-enable demo mode if auth is missing
    let obs;
    try {
      obs = this._coinService.getCoins();
    } catch (e) {
      this._coinService.enableDemoMode();
      obs = this._coinService.getCoins();
    }
    obs.subscribe((allCoins: any[]) => {
      this.allCoins = this.getUnique(
        //Geeft coins met zelfde "symbol" gelijke 'amount'
        allCoins.map((c) => {
          const coin = {
            symbol: c.symbol,
            amount: c.amount,
            //$key: c.key
            price: 0,
            transactions: 0,
            cost: 0,
            image_url: '',
          };
          //
          coin.amount = 0;
          for (let item of allCoins) {
            if (coin.symbol === item.symbol) {
              coin.amount += item.amount;
              coin.transactions += 1;
              coin.cost += (item.amount || 0) * (Number(item.priceBought) || 0);
            }
          }
          return coin;
        }),
        'symbol'
      );

      this.allCoins.sort((a, b) => a.symbol.localeCompare(b.symbol));
      this.dataSource.data = this.allCoins;

      // Wait for CoinGecko coin ID map before fetching prices/images
      const loadPrices = () => {
        for (var coin of this.allCoins) {
          this.geefPrijs(coin);
          this.geefImage(coin);
        }
      };

      if (Object.keys(this._coinService.coinIdMap).length > 0) {
        loadPrices();
      } else {
        const sub = this._coinService.coinIdMapSubject.subscribe((map) => {
          if (Object.keys(map).length > 0) {
            loadPrices();
            sub.unsubscribe();
          }
        });
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
    // Fetch price independently — don't block on dailyChange
    this._coinService.getCoinPrice(coin.symbol).pipe(
      map((val: any) => {
        const coinId = this._coinService.coinIdMap[coin.symbol.toLowerCase()];
        return val[coinId][(this.valuta || 'eur').toLowerCase()];
      })
    ).subscribe({
      next: (price) => {
        coin.price = price || 0;
      },
      error: () => {
        coin.price = 0;
      }
    });

    // Fetch 24h change independently
    this._coinService.dailyChange(coin.symbol).pipe(
      map((val: any) => val.prices?.[0]?.[1])
    ).subscribe({
      next: (oldPrice) => {
        coin.oldPrice = oldPrice;
        const price = coin.price;
        const percent = price && oldPrice ? (((price - oldPrice) / oldPrice) * 100).toFixed(2) : '0.00';
        this.priceChange$.next({
          ...this.priceChange$.value,
          [coin.symbol]: percent
        });
      },
      error: () => {}
    });
  }

  geefImage(coin) {
    this._coinService.getCoinImageUrl(coin.symbol).subscribe((url) => {
      coin.image_url = url;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.router.navigateByUrl('edit-coin/' + coinSymbol);
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
