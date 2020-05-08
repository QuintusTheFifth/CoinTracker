import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { ICoin, Coin } from "../coin";
import { catchError, tap } from 'rxjs/operators';
import { HttpClientModule, HttpClient, HttpErrorResponse } from '@angular/common/http'
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CoinListComponent } from '../coin-list/coin-list.component';


@Injectable({
  providedIn: 'root',
})
export class CoinsService {
  getCoinsCustomer() {
    return this.coinsList;
  }

  coinsList: Coin[] = [
    {
      coinName: 'XRP',
      price: null,
      amount: 2000,
      exchange: '',
      date: null,
      total: 0,
    },
    {
      coinName: 'BNB',
      price: null,
      amount: 25,
      date: null,
      exchange: '',
      total: 0,
    },
    {
      coinName: 'BTC',
      price: null,
      amount: 0.4,
      date: null,
      exchange: '',
      total: 0,
    },
  ];

  addNewCoin(coin) {
    for(let item of this.coinsList){
      if(coin.coinName===item.coinName){
        item.amount+=coin.amount;
        return;
      }
    }
    this.coinsList.push({
      total:coin.amount*coin.price,
      coinName: coin.coinName,
      price:0,
      amount:coin.amount,
      exchange:coin.exchange,
      date:coin.date
    })
    console.log(this.coinsList);
  }

  form: FormGroup = new FormGroup({
    coinName: new FormControl('',[Validators.required,Validators.minLength(2)]),
      priceBought: new FormControl(0),
      amount: new FormControl(0,[Validators.required,Validators.min(0.01)]),
      exchange: new FormControl(''),
      date: new FormControl('')
  });

  initializeFormGroup() {
    this.form.setValue({
      coinName: 'XRP',
      priceBought: 50,
      amount: 200,
      exchange: '',
      date: '',
    })
  }

  private API_KEY:string="e1d125c0-d5ed-4165-85eb-ddc177c4f134";
  private url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/map';
  private coinUrl = "api\coins.json";
  result:any;

  constructor(private _http: HttpClient) {}
/*   getCoins(): Observable<ICoin[]> {
    return this.http.get<ICoin[]>(this.coinUrl).pipe(
      tap((data) => console.log("All: " + JSON.stringify(data))),
      catchError(this.handleError)
    );
} */



  
  getPrice(coinName: string){
    return this._http.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinName}&tsyms=EUR`)
    .pipe(
      map((result=>this.result= result || [])))
  }

  getCoins(){
    return this._http.get("https://api.coincap.io/v2/assets")
  }

private handleError(err: HttpErrorResponse) {
  // in a  real world app, we may send the servver to some remote logging infrastructure
  // instead of just logging it to the console
  let errorMessage = "";
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
