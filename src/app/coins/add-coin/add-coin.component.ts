import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Coin } from '../coin';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
} from '@angular/forms';

import { Subject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

import { EMPTY, Observable } from 'rxjs';
import { CoinsService } from '../services/coin.data.service';
import {
  distinctUntilChanged,
  map,
  startWith,
  catchError,
} from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-coin',
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],
})
export class AddCoinComponent implements OnInit {
  coinSubmit: Coin;

  coinName = new FormControl();

  public filterCoinName: string;
  public filterCoin$ = new Subject<string>();

  filteredCoins: Observable<Coin[]>;

  PageTitle: string = 'Add a holding';
  public coin: FormGroup;

  public errorMessage: string = '';

  public confirmationMessage: string = '';

  public coinSymbol;

  constructor(
    public coinService: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.coinService.addCoinsToList();
    this.coins = this.coinService.getValidCoins();

    this.filteredCoins = this.coinName.valueChanges.pipe(
      this.coinSymbol ? startWith(this.coinSymbol) : startWith(),
      map((coin) => (coin ? this._filterCoins(coin) : this.coins.slice()))
    );
  }

  private _filterCoins(value: string): Coin[] {
    const filterValue = value.toLowerCase();
    return this.coins[0].filter(
      (coin) => coin.symbol.toLowerCase().indexOf(filterValue) === 0
    );
  }

  coins;

  coinSymbols: any[] = [];

  ngOnInit(): void {
    this.coinService.currentCoinSymbol.subscribe(
      (coinsymbol) => (this.coinSymbol = coinsymbol)
    );
  }

  getCoinSymbols() {
    this.coinService.getCoinSymbols().subscribe((res) => {
      Object.keys(res).forEach((key) => {
        this.coinSymbols.push(res[key].symbol);
      });
    });
  }

  onSubmit() {
    if (this.coinService.form.value.$key == 1) {
      this.coinService.addNewCoin(
        new Coin(
          this.coinService.form.value.id,
          this.coinService.form.value.coinName,
          this.coinService.form.value.amount,
          this.coinService.form.value.priceBought,
          this.coinService.form.value.date,
          this.coinService.form.value.exchange
        )
      );
      // this.coinService.form.reset();
      // this.coinService.initializeFormGroup();
      this.notificationService.success(':: Added successfully');
      this.onClose();
      return;
    }
    if (this.coinService.form.valid && this.checkCoinSymbol()) {
      if (this.coinService.form.get('$key').value == null) {
        this.coinService
          .addNewCoin(
            new Coin(
              this.coinService.form.value.id,
              this.coinName.value,
              this.coinService.form.value.amount,
              this.coinService.form.value.priceBought,
              this.coinService.form.value.date,
              this.coinService.form.value.exchange
            )
          )
          .pipe(
            catchError((err) => {
              this.errorMessage = err;
              return EMPTY;
            })
          )
          .subscribe((c: Coin) => {
            this.confirmationMessage = `a coin for ${c._name} was successfully added`;
          });
      }
    } else {
      this.coinService.updateCoin(
        new Coin(
          this.coinService.form.value.id,
          this.coinService.form.value.coinName,
          this.coinService.form.value.amount,
          this.coinService.form.value.priceBought,
          this.coinService.form.value.date,
          this.coinService.form.value.exchange
        )
      );
      this.onClose();
      return;
    }

    this.coinService.form.reset();
    this.coinService.initializeFormGroup();
    this.notificationService.success(':: Added successfully');
    // this.router
    //   .navigateByUrl('edit-coin', { skipLocationChange: true })
    //   .then(() => {
    //     this.router.navigate(['coin-list']);
    //   });
    location.reload();
    this.onClose();
  }

  getImage(coin) {
    if (`assets/svg/icon/${coin.symbol.toLowerCase()}.svg`)
      return `assets/svg/icon/${coin.symbol.toLowerCase()}.svg`;
  }

  checkCoinSymbol() {
    var good = false;
    try {
      for (var coin of this.coins[0]) {
        if (coin.symbol == this.coinName.value) {
          good = true;
          break;
        }
      }
      return good;
    } catch (Error) {}
  }

  onClear() {
    this.coinService.form.reset();
  }

  onClose() {
    this.coinService.form.reset();
    this.dialogRef.close();
  }
}
