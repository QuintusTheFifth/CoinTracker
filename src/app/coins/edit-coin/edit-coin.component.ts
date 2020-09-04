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
  price:number;
  valuta:string;

  ngOnInit(): void {
    this.getTransactions();
    this._coinService.currentCoinSymbol.subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.subscribe(
      (bigChart) => (this.bigChart = bigChart)
    );
    this._coinService.currentValuta.subscribe(
      (valuta)=>this.valuta=valuta
    )
      this._coinService.getCoinPrice(this.message).subscribe(
        (price)=>this.price=price[this.message][this.valuta]
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
    this.transactionsList = this._coinService.getTransactionsList().map((c)=>{
      console.log(c)
    const coin={
      id:c._id,
      _dateBought: c._dateBought.getFullYear()?'n/a':c._dateBought,
     _exchange:c._exchange?c._exchange:'n/a',
     _name:c._name,
     _amount:c._amount,
     _priceBought:c._priceBought?c._priceBought:'n/a',
    }
    return coin;
    });
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
