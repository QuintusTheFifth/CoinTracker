import { Component, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ICoin, Coin } from '../coin';
import { ArgumentOutOfRangeError } from 'rxjs';
import { AddCoinComponent } from '../add-coin/add-coin.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CoinsService } from '../services/coins.service';

@Component({
  templateUrl: './coin-list.component.html',
  styleUrls: ['./coin-list.component.css'],
})
export class CoinListComponent implements OnInit {
  pageTitle: string = 'CoinTracker';
  imageWidth = 10;
  imageMargin = 2;
  errorMessage = '';

  customerTotal:number=0

  constructor(
    private coinService: CoinsService,
    private dialog: MatDialog
  ) {}

  coins :Coin[]=this.coinService.getCoinsCustomer();

  objectKeys = Object.keys;
  cryptos: any;

  filteredCoins: ICoin[];
 
  ngOnInit(): void {

    this.getPrijzen();
   
    console.log(this.coins);

    this.filteredCoins = this.coins;
  }

  getPrijzen(){
    for (var coin of this.coins) {
      this.coinService.getPrice(coin.coinName).subscribe((res) => {
        console.log(Object.values(res)[0].EUR);
        console.log(Object.keys(res)[0]);


        // vind de gepaste coin en pas prijs aan
        var currentCoin=this.coins.find(
          (x) => x.coinName === Object.keys(res)[0]
        )
      currentCoin.price = Object.values(res)[0].EUR;

      // bereken totaal
      this.customerTotal+=(currentCoin.price*currentCoin.amount);
      });
    }
  }
  addNewCoin(newCoin: Coin) {
    this.coins.push(newCoin);
    this.getPrijzen();
    console.log(this.coins);
    this.customerTotal+=(newCoin.amount*newCoin.price);
    console.log(this.customerTotal);
  }

  onCreate(){
    this.coinService.initializeFormGroup();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus=true;
    dialogConfig.width="40%";
    this.dialog.open(AddCoinComponent,dialogConfig);
  }

  onEdit(coin){
    
  }
}
