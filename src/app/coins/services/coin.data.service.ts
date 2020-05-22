import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject } from 'rxjs';
import { Coin } from '../coin';
import { catchError, tap, delay, switchMap } from 'rxjs/operators';
import {
  HttpClientModule,
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CoinListComponent } from '../coin-list/coin-list.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoinsService {

  populateForm(coin) {
    this.form.setValue({
      coinName: coin._name,
      amount: coin._amount,
      priceBought: coin._priceBought,
      exchange: coin._exchange,
      date: coin._dateBought,
    });
  }
  private _coinsIndividu$ = new BehaviorSubject<Coin[]>([]);
  private _coins: Coin[];

  constructor(private _http: HttpClient) {
    this.coinsIndividu$.subscribe((coins: Coin[]) => {
      this._coins = coins;
      this._coinsIndividu$.next(this._coins);
    });
  }

  get coinsIndividu$(): Observable<Coin[]> {
    return this._http.get(`${environment.apiUrl}/coins/`).pipe(
      // delay(2000),
      catchError(this.handleError),
      //tap(console.log),
      map((list: any[]): Coin[] => list.map(Coin.fromJSON))
    );
  }

  get allCoins$(): Observable<Coin[]> {
    return this._coinsIndividu$;
  }

  addNewCoin(coin: Coin) {
    console.log(coin);
   return this._http
   .post(`${environment.apiUrl}/coins/`, coin.toJSON())
   .pipe(catchError(this.handleError), map(Coin.fromJSON))
   .pipe(
    // temporary fix, while we use the behaviorsubject as a cache stream
    catchError((err) => {
      return throwError(err);
    }),
    tap((c: Coin) => {
      console.log(c);
    })
  );
   
  }

  form: FormGroup = new FormGroup({
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
    console.log(this.getCoinSymbols());
    /*  const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    ); */
    this.form.setValue({
      coinName: 'BTC',
      amount: 0.03,
      priceBought: 1,
      exchange: '',
      date: '',
    });
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
      .pipe(map((result) => Object.values(result)[0]))
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
