import { Component, OnInit, AfterViewInit, OnDestroy, Input, Optional } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { NotificationService } from '../services/notification.service';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-coin',
  templateUrl: './edit-coin.component.html',
  styleUrls: ['./edit-coin.component.css'],
})
export class EditCoinComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    public _coinService: CoinsService,
    private notificationService: NotificationService,
    @Optional() public dialogRef: MatDialogRef<AddCoinComponent>,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  coinSymbol: string;
  errorMessage = '';

  displayedColumns: string[] = [
    'symbol',
    'date',
    'exchange',
    'amount',
    'price bought',
    'buttons',
  ];

  message: string;
  bigChart:boolean;
  price:number;
  valuta:string;
  exchangeFilter: string = '';

  get holdingsAmount(): number {
    if (!this.transactionsList) { return 0; }
    return this.transactionsList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }

  get holdingsValue(): number {
    return this.holdingsAmount * (this.price || 0);
  }

  get filteredTransactionsList(): any[] {
    if (!this.exchangeFilter || this.exchangeFilter.trim() === '') {
      return this.transactionsList;
    }
    const filter = this.exchangeFilter.trim().toLowerCase();
    return this.transactionsList.filter(tx =>
      tx.exchange && tx.exchange.toLowerCase().includes(filter)
    );
  }

  ngOnInit(): void {
    // Read coin symbol from route param for direct navigation (e.g. /edit-coin/BTC)
    const routeSymbol = this.route.snapshot.paramMap.get('symbol');
    if (routeSymbol && !this.message) {
      this.message = routeSymbol;
      this._coinService.changeMessage(routeSymbol);
    }
    this._coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (bigChart)=>(this.bigChart=bigChart)
    )

    this._coinService.currentValuta.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (valuta)=>this.valuta=valuta
    )
    if (this.message) {
      const coinId = this._coinService.coinIdMap[this.message.toLowerCase()];
      this._coinService.getCoinPrice(this.message).pipe(
        takeUntil(this.destroy$)
      ).subscribe(
        (price: any) => {
          if (coinId && price[coinId] && this.valuta) {
            this.price = price[coinId][(this.valuta || 'eur').toLowerCase()];
          }
        }
      );
      // Pre-fetch coin image for the header
      this._coinService.getCoinImageUrl(this.message).pipe(
        takeUntil(this.destroy$)
      ).subscribe();
    }

    this.getTransactions();
    //
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._coinService.changeBigChart(true);
      this._coinService.setCoinSymbol(this.message);
    });
  }

  changePeriod(number){
    this._coinService.changePeriod(number)
  }

  transactionsList: any[];

  getTransactions() {
    this._coinService.getCoinsPayload().pipe(
      takeUntil(this.destroy$)
    ).subscribe((transactions: any[]) => {
      (this.transactionsList = transactions.map((c: any) => {
        const data = c.payload.doc.data();
        const coin = {
          symbol: data.symbol,
          amount: data.amount,
          date: data.date ? data.date : 'n/a',
          exchange: data.exchange ? data.exchange : 'n/a',
          priceBought: data.priceBought
            ? data.priceBought
            : 'n/a',
          key: c.payload.doc.id,
        };
        if (data.symbol === this.message) {
          return coin;
        }
      })),
        (this.transactionsList = this.transactionsList.filter(function (c) {
          return c != null;
        }));
    });
  }

  onEdit(coin) {
    //

    this._coinService.populateForm(coin);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '90vw';
    dialogConfig.width = window.innerWidth < 600 ? '90vw' : '400px';
    dialogConfig.maxHeight = '90vh';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onDelete(coin) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this._coinService.deleteTransaction(coin.key);
      this.notificationService.warn('Removed successfully!');
    }
  }
  onCreate() {
    this._coinService.setSymbolInit(this.message);
    //
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '90vw';
    dialogConfig.width = window.innerWidth < 600 ? '90vw' : '400px';
    dialogConfig.maxHeight = '90vh';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
