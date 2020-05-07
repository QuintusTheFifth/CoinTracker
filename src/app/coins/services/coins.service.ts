import { Injectable } from '@angular/core';
import { throwError, Observable } from 'rxjs';
import { ICoin } from "../coin";
import { catchError, tap } from 'rxjs/operators';
import { HttpClientModule, HttpClient, HttpErrorResponse } from '@angular/common/http'
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CoinsService {

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
