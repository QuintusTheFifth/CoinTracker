import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
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
import { distinctUntilChanged, map, startWith, takeUntil } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-add-coin',
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],
})
export class AddCoinComponent implements OnInit, OnDestroy {
  coinSubmit: Coin;

  coinName = new FormControl();
  coins = [];

  filteredCoins: Observable<Coin[]>;

  PageTitle: string = 'Add a holding';
  public coin: FormGroup;

  public errorMessage: string = '';

  public confirmationMessage: string = '';

  public  coinsymbol = this.coinService.getCoinSymbol();

  exchanges: string[] = ['Binance', 'UpBit', 'Bittrex', 'eToroX'];
  filteredExchanges: Observable<string[]>;

  private destroy$ = new Subject<void>();

  constructor(
    public coinService: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.filteredCoins = this.coinName.valueChanges.pipe(
      startWith(''),
      map((coin) => (coin ? this._filterCoins(coin) : this.coins.slice()))
    );

    // this.coin = this.fb.group({
    //   name: ['', [Validators.required, Validators.minLength(2)]],
    // });
  }

  private _filterCoins(value: string): Coin[] {
    const filterValue = value.toLowerCase();
    if (!this.coins || !this.coins.length) { return []; }
    return this.coins.filter(
      (coin: any) => coin.symbol && coin.symbol.toLowerCase().indexOf(filterValue) === 0
    );
  }

  coinSymbols: any[] = [];
  message: string

  ngOnInit(): void {
    this.coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => this.message = message)

    this.coins = this.coinService.getValidCoins();

    // If the API hasn't loaded coins yet, seed from static coinIdMap
    if (!this.coins || this.coins.length === 0) {
      const staticCoins: Coin[] = Object.keys(this.coinService.coinIdMap).map(sym => ({
        icon: '',
        symbol: sym.toUpperCase(),
        name: sym,
      }));
      if (staticCoins.length > 0) {
        this.coins = staticCoins;
      }
    }

    this.filteredExchanges = this.coinService.form.get('exchange').valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      map(value => this._filterExchanges(value ? value : ''))
    );
  }

  private _filterExchanges(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.exchanges.filter(exchange =>
      exchange.toLowerCase().includes(filterValue)
    );
  }

  getCoinSymbols() {
    this.coinService.getCoinSymbols().subscribe((res) => {
      if (!res) { return; }
      res.forEach((coin: any) => {
        this.coinSymbols.push(coin.symbol);
      });
    });
  }
  key;

  checkCoinSymbol(symbol) {
    if (!symbol || !this.coins || !this.coins.length) { return true; }
    var good = false;
    for (var coin of this.coins) {
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

  getImage(coin) {
    // Use CoinGecko image if cached, otherwise return a placeholder
    const cached = this.coinService.coinImageCache[coin.symbol.toLowerCase()];
    return cached || 'assets/add.png';
  }

  onClose() {
    this.coinService.form.reset();
    this.coinService.initializeFormGroup();
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
