import { Component, OnInit, Input } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { NotificationService } from '../services/notification.service';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Coin } from '../coin';

@Component({
  selector: 'app-edit-coin',
  templateUrl: './edit-coin.component.html',
  styleUrls: ['./edit-coin.component.css'],
})
export class EditCoinComponent implements OnInit {
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
  bigChart: boolean;

  ngOnInit(): void {
    this.getTransactions();
    this._coinService.currentCoinSymbol.subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.subscribe(
      (bigChart) => (this.bigChart = bigChart)
    );
    //
  }

  async changePeriod(number) {
    await this._coinService.changePeriod(number);
    this.router
      .navigateByUrl('coin-graph', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['edit-coin']);
      });
    
  }

  transactionsList;

  getTransactions() {
    this.transactionsList = this._coinService.getTransactionsList();
    

    // this._coinService.getCoinsPayload().subscribe((transactions) => {
    //   (this.transactionsList = transactions.map((c) => {
    //     const coin = {
    //       symbol: c.payload.val().symbol,
    //       amount: c.payload.val().amount,
    //       date: c.payload.val().date ? c.payload.val().date : 'n/a',
    //       exchange: c.payload.val().exchange ? c.payload.val().exchange : 'n/a',
    //       priceBought: c.payload.val().priceBought
    //         ? c.payload.val().priceBought
    //         : 'n/a',
    //       key: c.payload.key,
    //     };
    //     if (c.payload.val().symbol === this.message) {
    //       //
    //       return coin;
    //     }
    //   })),
    //     (this.transactionsList = this.transactionsList.filter(function (c) {
    //       return c != null;
    //     }));
    //   //
    // });
  }

  onEdit(coin) {
    //

    this._coinService.populateForm(coin);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '30%';
    dialogConfig.height = '45%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }

  onDelete(coin) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      
      this._coinService.deleteTransaction(coin);
      this.notificationService.warn('Removed successfully!');
      this.router
        .navigateByUrl('coin-list', { skipLocationChange: true })
        .then(() => {
          this.router.navigate(['edit-coin']);
        });
    }
  }

  changeCoinSymbol(coinsymbol: string) {
    this._coinService.changeCoinSymbol(coinsymbol);
  }
  onCreate() {
    this._coinService.setSymbolInit(this.message);
    //
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.maxWidth = '30%';
    dialogConfig.height = '45%';
    this.dialog.open(AddCoinComponent, dialogConfig);
  }
}
