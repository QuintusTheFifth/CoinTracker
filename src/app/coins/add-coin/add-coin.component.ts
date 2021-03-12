import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
} from '@angular/forms';

import { Subject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

import { Observable } from 'rxjs';
import { CoinsService, Coin } from '../services/coin.data.service';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-add-coin',
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],
})
export class AddCoinComponent implements OnInit {
  coinSubmit: Coin;

  coinName = new FormControl();
  coins;

  filteredCoins: Observable<Coin[]>;

  PageTitle: string = 'Add a holding';
  public coin: FormGroup;

  public errorMessage: string = '';

  public confirmationMessage: string = '';

  public coinsymbol = this.coinService.getCoinSymbol();

  constructor(
    public coinService: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.filteredCoins = this.coinName.valueChanges.pipe(
      this.coinService.getCoinSymbol()
        ? startWith(this.coinService.getCoinSymbol())
        : startWith(),
      map((coin) => (coin ? this._filterCoins(coin) : this.coins.slice()))
    );

    // this.coin = this.fb.group({
    //   name: ['', [Validators.required, Validators.minLength(2)]],
    // });
  }

  private _filterCoins(value: string): Coin[] {
    const filterValue = value.toLowerCase();
    return this.coins[0].filter(
      (coin) => coin.symbol.toLowerCase().indexOf(filterValue) === 0
    );
  }

  coinSymbols: any[] = [];
  message: string

  ngOnInit(): void {
    this.coinService.currentMessage.subscribe(message => this.message = message)

    this.coins = this.coinService.getValidCoins();


  }

  getCoinSymbols() {
    this.coinService.getCoinSymbols().subscribe((res) => {
      Object.keys(res).forEach((key) => {
        //
        this.coinSymbols.push(res[key].symbol);
      });
    });
  }
  key;

  checkCoinSymbol(symbol) {
    var good = false;
    for (var coin of this.coins[0]) {
      if (coin.symbol == symbol) {
        good = true;
        break;
      }
    }
    return good;
  }

  addingSymbol;

  submitted: boolean;
  
  onSubmit() {
    this.addingSymbol = this.coinName.value;

    if (this.addingSymbol) this.coinService.setCoinSymbol(this.addingSymbol);
    this.key = null;
    this.submitted = true;

    if (
      this.coinService.form.valid &&
      (this.checkCoinSymbol(this.addingSymbol) ||
        this.message)
    ) {
      if (this.coinService.form.get('$key').value == null) {
        this.coinService.insertCoin(
          this.coinService.form.value,
          this.coinService.getCoinSymbol()
        );
      } else {
        this.coinService.updateCoin(this.coinService.form.value);
        this.key = 1;
      }

      this.coinService.form.get('$key').value == null
        ? this.notificationService.success(':: Added successfully')
        : this.notificationService.success(':: Updated successfully');

      this.coinService.form.reset();
      this.coinService.initializeFormGroup();

      this.onClose();

      this.submitted = false;
    }
  }

  Close() {
    //
    this.coinService.form.reset();
    this.dialogRef.close();
  }

  getImage(coin) {
    if (`assets/svg/icon/${coin.symbol.toLowerCase()}.svg`)
      return `assets/svg/icon/${coin.symbol.toLowerCase()}.svg`;
  }

  onClose() {
    this.coinService.form.reset();
    this.coinService.initializeFormGroup();
    this.dialogRef.close();
  }
}
