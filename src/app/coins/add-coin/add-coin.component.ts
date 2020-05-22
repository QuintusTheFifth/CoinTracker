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

@Component({
  selector: 'app-add-coin',
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],
})
export class AddCoinComponent implements OnInit {
  coinSubmit: Coin;

  myControl = new FormControl();
  options: string[] = [
    'BTC',
    'XRP',
    'USDT',
    'BCH',
    'TRX',
    'LTC',
    'BNB',
    'XLM',
    'ETH',
  ];
  filteredOptions: Observable<string[]>;

  public filterCoinName: string;
  public filterCoin$ = new Subject<string>();

  PageTitle: string = 'Add a holding';
  public coin: FormGroup;

  public errorMessage: string = '';

  public confirmationMessage: string = '';

  constructor(
    public coinService: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
    private fb: FormBuilder
  ) {
    this.filterCoin$
      .pipe(
        distinctUntilChanged(),
        map((val) => val.toLowerCase())
      )
      .subscribe((val) => (this.filterCoinName = val));

    this.coin = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  coins: Coin[];

  coinSymbols: any[] = [];

  ngOnInit(): void {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(
      (option) => option.toLowerCase().indexOf(filterValue) === 0
    );
  }

  getCoinSymbols() {
    this.coinService.getCoinSymbols().subscribe((res) => {
      Object.keys(res).forEach((key) => {
        console.log(res[key].symbol);
        this.coinSymbols.push(res[key].symbol);
      });
    });
  }

  onSubmit() {
    if (this.coinService.form.valid) {
      this.coinService
        .addNewCoin(
          new Coin(
            this.coinService.form.value.coinName,
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
          this.confirmationMessage = `a recipe for ${c._name} was successfully added`;
        });
      this.coinService.form.reset();
      this.coinService.initializeFormGroup();
      this.onClose();
    }
  }

  onClear() {
    this.coinService.form.reset();
  }

  onClose() {
    this.coinService.form.reset();
    this.coinService.initializeFormGroup();
    this.dialogRef.close();
  }
}
