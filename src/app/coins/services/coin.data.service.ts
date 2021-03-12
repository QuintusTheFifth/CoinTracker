import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFireList, AngularFireDatabase } from 'angularfire2/database';
import { AuthService } from 'src/app/authentication/auth.service';

export interface Coin {
  icon: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoinsService {
  test: 'hello';

  coins: Coin[] = [];

  private bigChartSource = new BehaviorSubject<boolean>(false);
  currentBigChart = this.bigChartSource.asObservable();

  private messageSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();

  private periodSource = new BehaviorSubject<number>(2000);
  currentPeriod = this.periodSource.asObservable();

  private valutaSource = new BehaviorSubject<string>('EUR');
  currentValuta = this.valutaSource.asObservable();

  changeMessage(message: string) {
    this.messageSource.next(message);
  }

  changePeriod(period: number) {
    this.periodSource.next(period);
    this.period = period;
  }

  changeBigChart(bigChart: boolean) {
    this.bigChartSource.next(bigChart);
  }

  changeValuta(valuta) {
    this.valutaSource.next(valuta);
  }

  updateCoin(coin) {
    //

    this.FirecoinList.update(coin.$key, {
      amount: coin.amount,
      date: coin.date,
      exchange: coin.exchange,
      priceBought: coin.priceBought,
      symbol: this.message,
    });
  }

  message: string;
  bigChart: boolean;
  period: number;
  valuta: string;

  setValuta(valuta) {
    this.valuta = valuta;
  }

  getValuta() {
    return this.valuta;
  }

  populateForm(coin) {
    //

    this.form.setValue({
      $key: coin.key,
      coinName: this.message,
      amount: coin.amount,
      priceBought: coin.priceBought,
      exchange: coin.exchange,
      date: coin.date,
    });
  }

  constructor(
    private _http: HttpClient,
    private firebase: AngularFireDatabase,
    public auth: AuthService
  ) {
    this.currentMessage.subscribe((message) => (this.message = message));
    this.bigChartSource.subscribe((bigChart) => (this.bigChart = bigChart));
    this.periodSource.subscribe((period) => (this.period = period));
    this.valutaSource.subscribe((valuta) => (this.valuta = valuta));
  }

  FirecoinList: AngularFireList<any>;

  form: FormGroup = new FormGroup({
    $key: new FormControl(null),
    coinName: new FormControl(' ', []),
    amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    priceBought: new FormControl(0),
    exchange: new FormControl(''),
    date: new FormControl(''),
  });

  setSymbolInit(symbol) {
    this.coinSymbol = symbol;
    let today = new Date().toISOString().slice(0, 10);

    this.form.setValue({
      $key: null,
      coinName: symbol,
      amount: 1,
      priceBought: '',
      exchange: '',
      date: today,
    });
  }

  initializeFormGroup() {
    let today = new Date().toISOString().slice(0, 10);

    this.form.setValue({
      $key: null,
      coinName: this.getCoinSymbol(),
      amount: 1,
      priceBought: '',
      exchange: '',
      date: today,
    });

    //
  }

  result: any;

  coinSymbol: string = '';

  setCoinSymbol(symbol) {
    this.coinSymbol = symbol;
  }

  getCoinSymbol() {
    return this.coinSymbol;
  }

  getCoinPrice(coinName) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinName}&tsyms=${this.valuta}`
      )
      .pipe(map((result) => result));
  }

  weekData(coinName) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coinName}&tsym=${this.valuta}&limit=7`
      )
      .pipe(map((result) => result));
  }

  bigData(coinName, period) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coinName}&tsym=${this.valuta}&limit=${period}`
      )
      .pipe(map((result) => result));
  }

  counter = 0;
  addCoinsToList() {
    this.getCoinSymbols().subscribe((c) => this.coins.push(c));
  }

  addIcons() {
    this.coins.forEach((c) => {
      c.icon = `assets/svg/icon/${c.symbol.toLowerCase()}`;
    });
  }

  getCoinSymbols() {
    return this._http
      .get('https://api.coincap.io/v2/assets')
      .pipe(map((result) => Object.values(result)[0]));
  }

  deleteCoin(coin) {
    const ref = this.firebase.database.ref(`${this.auth.getUID()}`);
    ref.once('value').then((snapshot) => {
      const user = snapshot.val();
      for (var coin_key in user) {
        const symbol = user[coin_key].symbol;
        if (symbol == coin.symbol) {
          ref.child(coin_key).remove();
        }
      }
    });
  }

  getCoinList() {
    return this.coins;
  }

  getValidCoins() {
    return this.coins;
  }

  deleteTransaction(key) {
    const ref = this.firebase.database.ref(`${this.auth.getUID()}`);
    ref.once('value').then(() => {
      ref.child(key).remove();
    });
  }

  getCoins() {
    //
    this.FirecoinList = this.firebase.list(`${this.auth.getUID()}`);
    return this.FirecoinList.valueChanges();
  }

  getCoinsPayload() {
    this.FirecoinList = this.firebase.list(`${this.auth.getUID()}`);
    return this.FirecoinList.snapshotChanges();
  }

  insertCoin(coin, name) {
    this.FirecoinList.push({
      symbol: name,
      amount: coin.amount,
      priceBought: coin.priceBought,
      date: coin.date,
      exchange: coin.exchange,
    });
  }

  dailyChange(coinName) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coinName}&tsym=${this.valuta}&limit=1`
      )
      .pipe(map((result) => result));
  }

  key = 'e1d125c0-d5ed-4165-85eb-ddc177c4f134';
  requestCMC(method, url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = resolve;
      xhr.onerror = reject;
      xhr.send();
    });
  }

  chart = [];

  getChart() {
    return this.chart;
  }
}
