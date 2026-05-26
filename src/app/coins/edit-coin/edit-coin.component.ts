import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { AngularFireDatabase } from 'angularfire2/database';
import { NotificationService } from '../services/notification.service';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-coin',
  templateUrl: './edit-coin.component.html',
  styleUrls: ['./edit-coin.component.css'],
})
export class EditCoinComponent implements OnInit, AfterViewInit {
  constructor(
    public _coinService: CoinsService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
    private dialog: MatDialog,
    private router: Router
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
    this._coinService.currentMessage.subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.subscribe(
      (bigChart)=>(this.bigChart=bigChart)
    )

    this._coinService.currentValuta.subscribe(
      (valuta)=>this.valuta=valuta
    )
    if (this.message) {
      const coinId = this._coinService.coinIdMap[this.message.toLowerCase()];
      this._coinService.getCoinPrice(this.message).subscribe(
        (price: any) => {
          if (coinId && price[coinId]) {
            this.price = price[coinId][this.valuta.toLowerCase()];
          }
        }
      );
      // Pre-fetch coin image for the header
      this._coinService.getCoinImageUrl(this.message).subscribe();
    }

    this.getTransactions();
    //
  }

  ngAfterViewInit() {
    this._coinService.changeBigChart(true);
    this._coinService.setCoinSymbol(this.message);
  }

  async changePeriod(number){
    await this._coinService.changePeriod(number)
    this.router.navigateByUrl('coin-graph', { skipLocationChange: true }).then(() => {
      this.router.navigate(['edit-coin']);
  }); 
  }

  transactionsList: any[];

  getTransactions() {
    this._coinService.getCoinsPayload().subscribe((transactions) => {
      (this.transactionsList = transactions.map((c) => {
        const coin = {
          symbol: c.payload.val().symbol,
          amount: c.payload.val().amount,
          date: c.payload.val().date ? c.payload.val().date : 'n/a',
          exchange: c.payload.val().exchange ? c.payload.val().exchange : 'n/a',
          priceBought: c.payload.val().priceBought
            ? c.payload.val().priceBought
            : 'n/a',
          key: c.payload.key,
        };
        if (c.payload.val().symbol === this.message) {
          //
          return coin;
        }
      })),
        (this.transactionsList = this.transactionsList.filter(function (c) {
          return c != null;
        }));
      //
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
}
