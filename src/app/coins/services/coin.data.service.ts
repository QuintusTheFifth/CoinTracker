import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { map, catchError } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
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

  coins: Coin[] = [];

  private bigChartSource = new BehaviorSubject<boolean>(false);
  currentBigChart = this.bigChartSource.asObservable();

  private messageSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();

  private periodSource = new BehaviorSubject<number>(2000);
  currentPeriod = this.periodSource.asObservable();

  private valutaSource = new BehaviorSubject<string>('EUR');
  currentValuta = this.valutaSource.asObservable();

  // CoinGecko coin ID map: symbol.toLowerCase() -> coin_id
  coinIdMap: Record<string, string> = {};
  coinIdMapSubject = new BehaviorSubject<Record<string, string>>({});

  // CoinGecko image cache: symbol.toLowerCase() -> image_url
  coinImageCache: Record<string, string> = {};

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
    if (this.isDemoMode) {
      const coins = this.getDemoCoins();
      const idx = coins.findIndex((c: any) => c.key === coin.$key);
      if (idx >= 0) {
        coins[idx] = {
          ...coins[idx],
          amount: coin.amount,
          date: coin.date,
          exchange: coin.exchange,
          priceBought: coin.priceBought,
          symbol: coin.symbol,
        };
        this.saveDemoCoins(coins);
      }
      return;
    }
    this.coinCollection.doc(coin.$key).update({
      amount: coin.amount,
      date: coin.date,
      exchange: coin.exchange,
      priceBought: coin.priceBought,
      symbol: coin.symbol,
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
    this.form.setValue({
      $key: coin.key,
      coinName: coin.symbol,
      amount: coin.amount,
      priceBought: coin.priceBought,
      exchange: coin.exchange,
      date: coin.date,
    });
  }

  // Demo mode helpers
  enableDemoMode(): void {
    localStorage.setItem('demoMode', '1');
    // Seed with demo data if empty
    if (this.getDemoCoins().length === 0) {
      this.saveDemoCoins([
        { symbol: 'BTC', amount: 1.5, priceBought: 45000, date: '2026-01-15', exchange: 'Binance', key: 'demo_1' },
        { symbol: 'ETH', amount: 15.2, priceBought: 2800, date: '2026-02-20', exchange: 'Coinbase', key: 'demo_2' },
        { symbol: 'SOL', amount: 120, priceBought: 120, date: '2026-03-10', exchange: 'Binance', key: 'demo_3' },
        { symbol: 'ADA', amount: 5000, priceBought: 0.35, date: '2026-04-05', exchange: 'Kraken', key: 'demo_4' },
      ]);
    }
  }

  constructor(
    private _http: HttpClient,
    private afs: AngularFirestore,
    public auth: AuthService
  ) {
  }

  /** Get reference to the user's coins subcollection in Firestore */
  private get coinCollection(): AngularFirestoreCollection<any> {
    const uid = this.auth.getUID();
    if (!uid) {
      // Demo mode — use localStorage fallback instead of throwing
      if (localStorage.getItem('demoMode')) {
        return null as any;
      }
      throw new Error('User not authenticated');
    }
    return this.afs.collection(`users/${uid}/coins`);
  }

  /** localStorage key for demo mode */
  private get demoKey(): string { return 'cointracker_demo_coins'; }

  /** Read coins from localStorage (demo mode) */
  private getDemoCoins(): any[] {
    try {
      return JSON.parse(localStorage.getItem(this.demoKey) || '[]');
    } catch { return []; }
  }

  /** Save coins to localStorage (demo mode) */
  private saveDemoCoins(coins: any[]): void {
    localStorage.setItem(this.demoKey, JSON.stringify(coins));
  }

  /** Whether the app is running in demo mode (localStorage fallback) */
  private get isDemoMode(): boolean {
    return !!localStorage.getItem('demoMode');
  }

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
  }

  result: any;

  coinSymbol: string = '';

  setCoinSymbol(symbol) {
    this.coinSymbol = symbol;
  }

  getCoinSymbol() {
    return this.coinSymbol;
  }

  /** Resolve a coin symbol to its CoinGecko coin ID using the coinIdMap */
  private resolveCoinId(coinSymbol: string): string {
    return this.coinIdMap[coinSymbol.toLowerCase()];
  }

  /** Get current price from CoinGecko /simple/price using coin IDs */
  getCoinPrice(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${this.valuta.toLowerCase()}`
      );
  }

  /** Get 7-day market chart data for the mini graph */
  weekData(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${this.valuta.toLowerCase()}&days=7`
      );
  }

  /** Get extended period market chart data for the big graph */
  bigData(coinSymbol: string, period: number) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${this.valuta.toLowerCase()}&days=${period}`
      );
  }

  counter = 0;
  addCoinsToList() {
    this.getCoinSymbols().subscribe((coinsArr: any[]) => {
      this.coins = coinsArr.map((c: any) => ({
        icon: '',
        symbol: c.symbol,
        name: c.name,
      }));
    });
  }

  /** Fetch coin images from CoinGecko and cache them */
  addIcons() {
    this.coins.forEach((c) => {
      if (!c.icon && this.coinImageCache[c.symbol.toLowerCase()]) {
        c.icon = this.coinImageCache[c.symbol.toLowerCase()];
      } else if (!c.icon) {
        this.getCoinImageUrl(c.symbol).subscribe((url) => {
          c.icon = url;
          this.coinImageCache[c.symbol.toLowerCase()] = url;
        });
      }
    });
  }

  /** Fetch coin list from CoinGecko /coins/list and build coinIdMap */
  getCoinSymbols(): Observable<any[]> {
    return this._http
      .get('https://api.coingecko.com/api/v3/coins/list')
      .pipe(
        map((result: any[]) => {
          const map: Record<string, string> = {};
          result.forEach((coin) => {
            map[coin.symbol.toLowerCase()] = coin.id;
          });
          this.coinIdMap = map;
          this.coinIdMapSubject.next({ ...map });
          return result;
        })
      );
  }

  /** Fetch 2 days of market_chart data to calculate 24h price change */
  dailyChange(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${this.valuta.toLowerCase()}&days=2`
      );
  }

  /** Get coin image URL from CoinGecko */
  getCoinImageUrl(coinSymbol: string): Observable<string> {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    if (this.coinImageCache[coinSymbol.toLowerCase()]) {
      return of(this.coinImageCache[coinSymbol.toLowerCase()]);
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
      )
      .pipe(
        map((result: any) => {
          const url = result.image?.small || result.image?.large || '';
          this.coinImageCache[coinSymbol.toLowerCase()] = url;
          return url;
        }),
        catchError(() => of(''))
      );
  }

  deleteCoin(coin) {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins().filter((c: any) => c.symbol !== coin.symbol);
      this.saveDemoCoins(coins);
      return;
    }
    // Get the user's coin collection and delete all coins matching this symbol
    this.coinCollection.ref.get().then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.symbol === coin.symbol) {
          doc.ref.delete();
        }
      });
    });
  }

  getCoinList() {
    return this.coins;
  }

  getValidCoins() {
    return this.coins;
  }

  deleteTransaction(key) {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins().filter((c: any) => c.key !== key);
      this.saveDemoCoins(coins);
      return;
    }
    this.coinCollection.doc(key).delete();
  }

  getCoins() {
    if (this.isDemoMode) {
      // Auto-seed demo data if empty
      if (this.getDemoCoins().length === 0) {
        this.enableDemoMode();
      }
      return new Observable(observer => {
        observer.next(this.getDemoCoins());
        observer.complete();
      });
    }
    return this.coinCollection.valueChanges();
  }

  getCoinsPayload() {
    if (this.isDemoMode) {
      return new Observable(observer => {
        const coins = this.getDemoCoins();
        observer.next(coins.map((c: any, i: number) => ({
          payload: { doc: { id: c.key || `demo_${i}`, data: () => c } }
        })));
        observer.complete();
      });
    }
    return this.coinCollection.snapshotChanges();
  }

  insertCoin(coin, name) {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins();
      coins.push({
        symbol: name,
        amount: coin.amount,
        priceBought: coin.priceBought,
        date: coin.date,
        exchange: coin.exchange,
        key: `demo_${Date.now()}`,
      });
      this.saveDemoCoins(coins);
      return;
    }
    this.coinCollection.add({
      symbol: name,
      amount: coin.amount,
      priceBought: coin.priceBought,
      date: coin.date,
      exchange: coin.exchange,
    });
  }
}