import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { Coin } from '../coin';
import { catchError, tap, delay } from 'rxjs/operators';
import {
  HttpClientModule,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CoinListComponent } from '../coin-list/coin-list.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoinsService {
  private _coinsIndividu$ = new BehaviorSubject<Coin[]>([]);
  private _coins:Coin[];

  constructor(private _http: HttpClient) {
    this.coinsIndividu$.subscribe((coins: Coin[]) => {
      this._coins = coins;
      this._coinsIndividu$.next(this._coins);
    });
  }

  get coinsIndividu$(): Observable<Coin[]> {
    return this._http.get(`${environment.apiUrl}/coins/`).pipe(
      delay(2000),
      catchError(this.handleError),
      //tap(console.log),
      map((list: any[]): Coin[] => list.map(Coin.fromJSON))
    );
  }

  get allCoins$(): Observable<Coin[]> {
    return this._coinsIndividu$;
  }

  addNewCoin(coin: Coin) {
    return this._http
      .post(`${environment.apiUrl}/coins/`, coin.toJSON())
      .pipe(catchError(this.handleError), map(Coin.fromJSON))
      .subscribe();
  }

  form: FormGroup = new FormGroup({
    coinName: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    priceBought: new FormControl(0),
    amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    exchange: new FormControl(''),
    date: new FormControl(''),
  });

  initializeFormGroup() {
    /*    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ); */
    this.form.setValue({
      coinName: 'XRP',
      priceBought: 50,
      amount: 200,
      exchange: '',
      date: '',
    });
  }

  private API_KEY: string = 'e1d125c0-d5ed-4165-85eb-ddc177c4f134';
  private url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map';
  private coinUrl = 'apicoins.json';
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

  deleteCoin(coin: Coin) {
    return this._http
      .delete(`${environment.apiUrl}/coins/${coin.id}`)
      .pipe(tap(console.log), catchError(this.handleError))
      .subscribe(() => {
        this._coins = this._coins.filter((c) => c.id != coin.id);
        this._coinsIndividu$.next(this._coins);
      });
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
