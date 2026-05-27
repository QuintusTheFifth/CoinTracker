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

import { Observable, combineLatest } from 'rxjs';
import { CoinsService, Coin } from '../services/coin.data.service';
import { debounceTime, distinctUntilChanged, map, startWith, takeUntil } from 'rxjs/operators';
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
    // Re-filter when the user types OR when the coin universe finishes loading.
    this.filteredCoins = combineLatest([
      this.coinName.valueChanges.pipe(startWith(''), debounceTime(150), distinctUntilChanged()),
      this.coinService.coinsSubject,
    ]).pipe(
      map(([coin, coins]) => this._filterCoins(typeof coin === 'string' ? coin : '', coins))
    );

    // this.coin = this.fb.group({
    //   name: ['', [Validators.required, Validators.minLength(2)]],
    // });
  }

  private _filterCoins(value: string, coins?: Coin[]): Coin[] {
    const filterValue = (value || '').toLowerCase();
    const list = (coins && coins.length) ? coins : this.coins;
    if (!list || !list.length) { return []; }
    const cache = this.coinService.coinImageCache;
    // Empty query → show popular coins (those with a real icon), not all ~10k.
    const matches = !filterValue
      ? list.filter((coin: any) => coin.symbol && cache[coin.symbol.toLowerCase()])
      : list.filter((coin: any) => coin.symbol && coin.symbol.toLowerCase().indexOf(filterValue) === 0);
    matches.sort((a: any, b: any) => {
      // Exact symbol match first, then well-known coins (those with a real icon).
      const aExact = a.symbol.toLowerCase() === filterValue ? 0 : 1;
      const bExact = b.symbol.toLowerCase() === filterValue ? 0 : 1;
      if (aExact !== bExact) { return aExact - bExact; }
      const aKnown = cache[a.symbol.toLowerCase()] ? 0 : 1;
      const bKnown = cache[b.symbol.toLowerCase()] ? 0 : 1;
      if (aKnown !== bKnown) { return aKnown - bKnown; }
      return a.symbol.localeCompare(b.symbol);
    });
    return matches.slice(0, 50);
  }

  coinSymbols: any[] = [];
  message: string

  ngOnInit(): void {
    // Ensure the searchable universe + top-coin icons are loaded for the picker.
    this.coinService.addCoinsToList();
    this.coinService.ensureTopMarkets();

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
    // Real CoinGecko icon if known, else the bundled SVG (template falls back to add.png)
    return this.coinService.iconFor(coin.symbol);
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
