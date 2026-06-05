import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener } from '@angular/core';
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

  coinName = new FormControl('', [Validators.required, Validators.minLength(2)]);
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
      map((coin) => this._filterCoins(coin || ''))
    );

    // this.coin = this.fb.group({
    //   name: ['', [Validators.required, Validators.minLength(2)]],
    // });
  }

  private _filterCoins(value: string): Coin[] {
    const filterValue = value.toLowerCase().trim();
    if (!this.coins || !this.coins.length || filterValue.length < 2) { return []; }
    return this.coins.filter(
      (coin: any) => coin.symbol && coin.symbol.toLowerCase().indexOf(filterValue) === 0
    ).sort((a: any, b: any) => {
      const aExact = a.symbol.toLowerCase() === filterValue ? 0 : 1;
      const bExact = b.symbol.toLowerCase() === filterValue ? 0 : 1;
      if (aExact !== bExact) { return aExact - bExact; }
      const aCanonical = this.coinService.coinIdMap[a.symbol.toLowerCase()] === a.id ? 0 : 1;
      const bCanonical = this.coinService.coinIdMap[b.symbol.toLowerCase()] === b.id ? 0 : 1;
      if (aCanonical !== bCanonical) { return aCanonical - bCanonical; }
      return (a.name || a.symbol).localeCompare(b.name || b.symbol);
    }).slice(0, 10);
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
      this.coinSymbols = Array.from(new Set(res.map((coin: any) => (coin.symbol || '').toUpperCase())));
    });
  }
  key;

  checkCoinSymbol(symbol) {
    if (!symbol) { return false; }
    if (!this.coins || !this.coins.length) { return true; }
    const normalizedSymbol = String(symbol).toUpperCase();
    var good = false;
    for (var coin of this.coins) {
      if (String(coin.symbol).toUpperCase() === normalizedSymbol) {
        good = true;
        break;
      }
    }
    return good;
  }

  addingSymbol;

  submitted: boolean;
  
  onSubmit() {
    this.addingSymbol = this.message || this.coinName.value;
    if (!this.message) {
      this.coinName.markAsTouched();
    }

    if (this.addingSymbol) {
      this.coinService.setCoinSymbol(this.addingSymbol.toUpperCase());
    }
    this.key = null;
    this.submitted = true;

    if (
      this.coinService.form.valid &&
      (this.message || this.checkCoinSymbol(this.addingSymbol))
    ) {
      if (this.coinService.form.get('$key').value === null) {
        this.coinService.insertCoin(
          this.coinService.form.value,
          this.coinService.getCoinSymbol()
        );
      } else {
        this.coinService.updateCoin(this.coinService.form.value);
        this.key = 1;
      }

      this.coinService.form.get('$key').value === null
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
