import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { Coin } from '../coin';
import { catchError, tap } from 'rxjs/operators';
import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';

interface validCoin {
  icon: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoinsService {
  transactionsList;
  setCoins(allCoins: Coin[]) {
    this.transactionsList = allCoins;
  }

  getTransactionsList() {
    return this.transactionsList.filter((c) => c._name == this.coinsymbol);
  }
  getCoinPrice(coinName) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinName}&tsyms=${this.valuta}`
      )
      .pipe(map((result) => result));
  }

  dailyChange(coinName) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coinName}&tsym=${this.valuta}&limit=1`
      )
      .pipe(map((result) => result));
  }
  changeValuta(valuta) {
    this.valutaSource.next(valuta);
  }
  bigData(coinName, period) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coinName}&tsym=${this.valuta}&limit=${period}`
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
  coinSymbol: any;

  addCoinsToList() {
    this.getCoinSymbols().subscribe((c) => this.coins.push(c));
  }

  coins: validCoin[] = [];
  period: number;
  valuta: string;

  getValidCoins() {
    return this.coins;
  }

  private coinsymbolSource = new BehaviorSubject<string>('');
  currentCoinSymbol = this.coinsymbolSource.asObservable();

  private bigChartSource = new BehaviorSubject<boolean>(false);
  currentBigChart = this.bigChartSource.asObservable();

  private periodSource = new BehaviorSubject<number>(2000);
  currentPeriod = this.periodSource.asObservable();

  private valutaSource = new BehaviorSubject<string>('EUR');
  currentValuta = this.valutaSource.asObservable();

  populateForm(coin) {
    this.form.setValue({
      id: coin.id,
      $key: null,
      coinName: coin._name,
      amount: coin._amount,
      priceBought: coin._priceBought,
      exchange: coin._exchange,
      date: coin._dateBought,
    });
  }
  private _coinsIndividu$ = new BehaviorSubject<Coin[]>([]);
  private _coins: Coin[];

  bigChart: boolean;
  coinsymbol: string;

  constructor(private _http: HttpClient) {
    this.coinsIndividu$.subscribe((coins: Coin[]) => {
      this._coins = coins;
      this._coinsIndividu$.next(this._coins);
    });
    this.valutaSource.subscribe((valuta) => (this.valuta = valuta));
    this.periodSource.subscribe((period) => (this.period = period));
    this.bigChartSource.subscribe((bigChart) => (this.bigChart = bigChart));
    this.currentCoinSymbol.subscribe(
      (coinsymbol) => (this.coinsymbol = coinsymbol)
    );
  }

  get coinsIndividu$(): Observable<Coin[]> {
    return this._http.get(`${environment.apiUrl}/coins/`).pipe(
      // delay(2000),
      catchError(this.handleError),
      map((list: any[]): Coin[] => list.map(Coin.fromJSON))
    );
  }

  deleteTransaction(coin) {
    console.log(coin)
    return this._http.delete(`${environment.apiUrl}/coins/?id=${coin.id}`)
  }

  deleteCoins(coin) {
    return this._http
      .delete(`${environment.apiUrl}/coins/${coin.symbol}`)
      .subscribe(() => {
        this._coins = this._coins.filter((c) => c.id != coin.id);
        this._coinsIndividu$.next(this._coins);
      });
  }

  get allCoins$(): Observable<Coin[]> {
    return this._coinsIndividu$;
  }

  changePeriod(period: number) {
    this.periodSource.next(period);
    this.period = period;
  }

  changeBigChart(bigChart: boolean) {
    this.bigChartSource.next(bigChart);
  }

  updateCoin(coin: Coin) {
    console.log(coin)
    console.log(coin.toJSON())
    return this._http
      .put(`${environment.apiUrl}/coins/${coin.id}`, coin.toJSON())
      .pipe(catchError(this.handleError), map(Coin.fromJSON))
      .pipe(
        // temporary fix, while we use the behaviorsubject as a cache stream
        catchError((err) => {
          return throwError(err);
        }),
        tap(() => {})
      );
  }

  name: string;

  callCustomerName() {
    return this._http
      .get(`${environment.apiUrl}/Customer/`)
      .pipe(map((result) => (this.name = result['firstName'])));
  }

  addNewCoin(coin: Coin) {
    return this._http
      .post(`${environment.apiUrl}/coins/`, coin.toJSON())
      .pipe(catchError(this.handleError), map(Coin.fromJSON))
      .pipe(
        // temporary fix, while we use the behaviorsubject as a cache stream
        catchError((err) => {
          return throwError(err);
        }),
        tap(() => {})
      );
  }

  form: FormGroup = new FormGroup({
    id: new FormControl(),
    $key: new FormControl(null),
    coinName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    priceBought: new FormControl(0),
    exchange: new FormControl(''),
    date: new FormControl(''),
  });

  initializeFormGroup() {
    let today = new Date().toISOString().slice(0, 10);

    this.form.setValue({
      id: null,
      $key: null,
      coinName: this.currentCoinSymbol,
      amount: 1,
      priceBought: '',
      exchange: 'Binance',
      date: today,
    });
  }
  setSymbolInit(symbol) {
    this.coinSymbol = symbol;
    let today = new Date().toISOString().slice(0, 10);

    this.form.setValue({
      id: null,
      $key: 1,
      coinName: symbol,
      amount: 1,
      priceBought: '',
      exchange: '',
      date: today,
    });
  }

  changeCoinSymbol(coinsymbol: string) {
    this.coinsymbolSource.next(coinsymbol);
  }

  result: any;

  getLiveCoinPrices(coinName: string) {
    return this._http
      .get(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinName}&tsyms=EUR`
      )
      .pipe(map((result) => (this.result = result || [])));
  }

  getCoinSymbols() {
    return this._http
      .get('https://api.coincap.io/v2/assets')
      .pipe(map((result) => Object.values(result)[0]));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a  real world app, we may send the servver to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occured. Handle it accordingly.
      errorMessage = `An error occured: ${err.error.message}`;
    } else {
      // The backend returned an unsuccesful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
