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

  private confettiFired = false;
  private pricesLoadedCount = 0;
  private confettiRAFId: number;

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
            image_url: '',
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

      // Wait for CoinGecko coin ID map before fetching prices/images
      const loadPrices = () => {
        for (var coin of this.allCoins) {
          this.geefPrijs(coin);
          this.geefImage(coin);
        }
        this.pricesLoadedCount = 0;
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
    forkJoin({
      oldPrice: this._coinService.dailyChange(coin.symbol).pipe(
        map((val: any) => val.prices?.[0]?.[1])
      ),
      price: this._coinService.getCoinPrice(coin.symbol).pipe(
        map((val: any) => {
          const coinId = this._coinService.coinIdMap[coin.symbol.toLowerCase()];
          return val[coinId][(this.valuta || 'eur').toLowerCase()];
        })
      )
    }).subscribe({
      next: ({ oldPrice, price }) => {
        coin.price = price;
        coin.oldPrice = oldPrice;
        const percent = price && oldPrice ? (((price - oldPrice) / oldPrice) * 100).toFixed(2) : '0.00';
        this.priceChange$.next({
          ...this.priceChange$.value,
          [coin.symbol]: percent
        });
        this.pricesLoadedCount++;
        if (
          !this.confettiFired &&
          this.pricesLoadedCount >= this.allCoins.length &&
          this.allCoins.every(c => c.price && c.price > 0)
        ) {
          setTimeout(() => this.triggerConfetti(), 500);
        }
      },
      error: () => {
        this.pricesLoadedCount++;
      }
    });
  }

  geefImage(coin) {
    this._coinService.getCoinImageUrl(coin.symbol).subscribe((url) => {
      coin.image_url = url;
    });
  }

  /** Trigger a simple canvas confetti burst for delight 🎉 */
  triggerConfetti() {
    if (this.confettiFired) return;
    this.confettiFired = true;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: any[] = [];
    const colors = ['#f44336','#e91e63','#9c27b0','#3f51b5','#03a9f4','#009688','#8bc34a','#ffeb3b','#ff9800','#ff5722'];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 10,
      });
    }

    let frame = 0;
    const maxFrames = 120;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      let alive = false;
      for (const p of pieces) {
        if (p.y > canvas.height + 50) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.rot += p.rv;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive && frame < maxFrames) {
        this.confettiRAFId = requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };
    animate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.confettiRAFId) {
      cancelAnimationFrame(this.confettiRAFId);
    }
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
