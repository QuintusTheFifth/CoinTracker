import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { map, catchError, tap, timeout } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AuthService } from 'src/app/authentication/auth.service';

export interface Coin {
  icon: string;
  symbol: string;
  name: string;
  id?: string;
}

export interface CoinTransaction {
  key?: string;
  $key?: string;
  symbol: string;
  amount: number;
  priceBought: number;
  exchange: string;
  date: string;
}

interface CoinPayloadSnapshot {
  payload: {
    doc: {
      id: string;
      data: () => CoinTransaction;
    };
  };
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

  private periodSource = new BehaviorSubject<number>(90);
  currentPeriod = this.periodSource.asObservable();

  private valutaSource = new BehaviorSubject<string>('EUR');
  currentValuta = this.valutaSource.asObservable();

  private marketStatusSource = new BehaviorSubject<string>('Live market data');
  currentMarketStatus = this.marketStatusSource.asObservable();

  // CoinGecko coin ID map: symbol.toLowerCase() -> coin_id
  // Static fallback for top coins so the app works without the /coins/list API call
  coinIdMap: Record<string, string> = {
    'btc': 'bitcoin', 'eth': 'ethereum', 'sol': 'solana', 'ada': 'cardano',
    'usdt': 'tether', 'bnb': 'binancecoin', 'xrp': 'ripple', 'usdc': 'usd-coin',
    'doge': 'dogecoin', 'dot': 'polkadot', 'matic': 'matic-network', 'shib': 'shiba-inu',
    'trx': 'tron', 'avax': 'avalanche-2', 'link': 'chainlink', 'uni': 'uniswap',
    'atom': 'cosmos', 'ltc': 'litecoin', 'etc': 'ethereum-classic', 'xlm': 'stellar',
    'fil': 'filecoin', 'vet': 'vechain', 'aave': 'aave', 'algo': 'algorand',
  };
  private canonicalSymbols = new Set(Object.keys(this.coinIdMap));
  coinIdMapSubject = new BehaviorSubject<Record<string, string>>({});

  // CoinGecko image cache: symbol.toLowerCase() -> image_url
  coinImageCache: Record<string, string> = {};
  private demoCoinsSource = new BehaviorSubject<CoinTransaction[]>(this.getDemoCoins());

  // Static fallback data when CoinGecko is unreachable (e.g. Firebase CORS)
  private staticPrices: Record<string, number> = {
    btc: 63500, eth: 2910, sol: 129, ada: 0.38, usdt: 1.0,
    bnb: 580, xrp: 0.52, usdc: 1.0, doge: 0.12, dot: 5.8,
  };
  private staticOldPrices: Record<string, number> = {
    btc: 59800, eth: 3110, sol: 134, ada: 0.41, usdt: 1.0,
    bnb: 610, xrp: 0.49, usdc: 1.0, doge: 0.14, dot: 6.2,
  };
  private staticImages: Record<string, string> = {
    btc: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    eth: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    sol: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    ada: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    usdt: 'https://assets.coingecko.com/coins/images/325/small/tether.png',
    bnb: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    usdc: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    doge: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    dot: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  };

  getFallbackPrice(coinSymbol: string): number {
    return this.staticPrices[(coinSymbol || '').toLowerCase()] || 0;
  }

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

  changeValuta(valuta: string): void {
    this.valuta = valuta || 'EUR';
    this.valutaSource.next(this.valuta);
  }

  updateCoin(coin: CoinTransaction): void {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins();
      const idx = coins.findIndex((c: CoinTransaction) => c.key === coin.$key);
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
  valuta: string = 'EUR';

  setValuta(valuta: string): void {
    this.valuta = valuta;
  }

  getValuta() {
    return this.valuta;
  }

  populateForm(coin: CoinTransaction): void {
    this.formMode = 'edit';
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
  private get coinCollection(): AngularFirestoreCollection<CoinTransaction> {
    const uid = this.auth.getUID();
    if (!uid) {
      throw new Error('User not authenticated');
    }
    return this.afs.collection(`users/${uid}/coins`);
  }

  /** localStorage key for demo mode */
  private get demoKey(): string { return 'cointracker_demo_coins'; }

  /** Read coins from localStorage (demo mode) */
  private getDemoCoins(): CoinTransaction[] {
    try {
      return JSON.parse(localStorage.getItem(this.demoKey) || '[]');
    } catch { return []; }
  }

  /** Save coins to localStorage (demo mode) */
  private saveDemoCoins(coins: CoinTransaction[]): void {
    localStorage.setItem(this.demoKey, JSON.stringify(coins));
    this.demoCoinsSource.next(coins);
  }

  /** Whether the app is running in demo mode (localStorage fallback) */
  private get isDemoMode(): boolean {
    return !!localStorage.getItem('demoMode');
  }

  form: FormGroup = new FormGroup({
    $key: new FormControl(null),
    coinName: new FormControl(''),
    amount: new FormControl(1, [Validators.required, Validators.min(0.00000001)]),
    priceBought: new FormControl('', [Validators.min(0)]),
    exchange: new FormControl(''),
    date: new FormControl(''),
  });

  formMode: 'addCoin' | 'addTransaction' | 'edit' = 'addCoin';

  setSymbolInit(symbol) {
    this.coinSymbol = symbol;
    this.formMode = 'addTransaction';
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
    this.formMode = 'addCoin';
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

  coinSymbol: string = '';

  setCoinSymbol(symbol) {
    this.coinSymbol = symbol;
  }

  getCoinSymbol() {
    return this.coinSymbol;
  }

  /** Resolve a coin symbol to its CoinGecko coin ID using the coinIdMap */
  private resolveCoinId(coinSymbol: string): string {
    if (!coinSymbol) return '';
    return this.coinIdMap[coinSymbol.toLowerCase()] || '';
  }

  /** Get current price from CoinGecko /simple/price using coin IDs */
  getCoinPrice(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      this.marketStatusSource.next('Estimated fallback prices');
      const result: Record<string, Record<string, number>> = { unknown: {} };
      result.unknown[(this.valuta || 'eur').toLowerCase()] = 0;
      return of(result);
    }
    const sym = coinSymbol.toLowerCase();
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${(this.valuta || 'eur').toLowerCase()}`
      ).pipe(
        timeout(5000),
        tap(() => this.marketStatusSource.next('Live market data')),
        catchError(() => {
          // Return static fallback price wrapped in the expected format
          const price = this.staticPrices[sym];
          if (price !== undefined) {
            this.marketStatusSource.next('Estimated fallback prices');
            const result: Record<string, Record<string, number>> = {};
            result[coinId] = {};
            result[coinId][(this.valuta || 'eur').toLowerCase()] = price;
            return of(result);
          }
          this.marketStatusSource.next('Estimated fallback prices');
          const result: Record<string, Record<string, number>> = {};
          result[coinId] = {};
          result[coinId][(this.valuta || 'eur').toLowerCase()] = 0;
          return of(result);
        })
      );
  }

  /** Get 7-day market chart data for the mini graph */
  weekData(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return of({ prices: [] });
    }
    const sym = coinSymbol.toLowerCase();
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${(this.valuta || 'eur').toLowerCase()}&days=7`
      ).pipe(
        timeout(5000),
        catchError(() => {
          const price = this.staticPrices[sym];
          if (price !== undefined) {
            const now = Date.now();
            const points = 50;
            const prices: number[][] = [];
            for (let i = 0; i < points; i++) {
              prices.push([now - (points - i) * (7 * 86400000 / points), price * (0.9 + Math.random() * 0.2)]);
            }
            return of({ prices });
          }
          return of({ prices: [] });
        })
      );
  }

  /** Get extended period market chart data for the big graph */
  bigData(coinSymbol: string, period: number) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return of({ prices: [] });
    }
    const sym = coinSymbol.toLowerCase();
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${(this.valuta || 'eur').toLowerCase()}&days=${period}`
      ).pipe(
        timeout(5000),
        catchError(() => {
          const price = this.staticPrices[sym];
          if (price !== undefined) {
            const now = Date.now();
            const points = 90;
            const prices: number[][] = [];
            for (let i = 0; i < points; i++) {
              prices.push([now - (points - i) * (period * 86400000 / points), price * (0.85 + Math.random() * 0.3)]);
            }
            return of({ prices });
          }
          return of({ prices: [] });
        })
      );
  }

  counter = 0;
  addCoinsToList() {
    this.getCoinSymbols().subscribe({
      next: (coinsArr: Coin[]) => {
        if (coinsArr && coinsArr.length > 0) {
          this.coins = coinsArr.map((c: Coin) => ({
            icon: '',
            symbol: (c.symbol || '').toUpperCase(),
            name: c.name,
            id: c.id,
          }));
        }
      },
      error: () => {} // Silently ignore — static coinIdMap already covers fallback
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
  getCoinSymbols(): Observable<Coin[]> {
    return this._http
      .get('https://api.coingecko.com/api/v3/coins/list')
      .pipe(
        timeout(5000),
        map((result: Coin[]) => {
          result.forEach((coin) => {
            const symbol = (coin.symbol || '').toLowerCase();
            if (!symbol || this.coinIdMap[symbol]) {
              return;
            }
            this.coinIdMap[symbol] = coin.id;
          });
          this.coinIdMapSubject.next({ ...this.coinIdMap });
          return result.sort((a, b) => {
            const aSymbol = (a.symbol || '').toLowerCase();
            const bSymbol = (b.symbol || '').toLowerCase();
            const aCanonical = this.canonicalSymbols.has(aSymbol) ? 0 : 1;
            const bCanonical = this.canonicalSymbols.has(bSymbol) ? 0 : 1;
            if (aCanonical !== bCanonical) {
              return aCanonical - bCanonical;
            }
            return (a.symbol || '').localeCompare(b.symbol || '');
          });
        }),
        catchError(() => {
          // API failed — emit static fallback immediately so prices still work
          this.coinIdMapSubject.next({ ...this.coinIdMap });
          return of([]);
        })
      );
  }

  /** Fetch 2 days of market_chart data to calculate 24h price change */
  dailyChange(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    const sym = coinSymbol.toLowerCase();
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${(this.valuta || 'eur').toLowerCase()}&days=2`
      ).pipe(
        timeout(5000),
        catchError(() => {
          const oldPrice = this.staticOldPrices[sym];
          if (oldPrice !== undefined) {
            return of({ prices: [[Date.now() - 86400000, oldPrice], [Date.now(), this.staticPrices[sym]]] });
          }
          return throwError(() => new Error(`No static fallback for ${coinSymbol}`));
        })
      );
  }

  /** Fetch coin image URL from CoinGecko */
  getCoinImageUrl(coinSymbol: string): Observable<string> {
    const symbolKey = (coinSymbol || '').toLowerCase();
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    if (this.coinImageCache[symbolKey]) {
      return of(this.coinImageCache[symbolKey]);
    }
    const staticUrl = this.staticImages[symbolKey];
    if (staticUrl) {
      this.coinImageCache[symbolKey] = staticUrl;
      return of(staticUrl);
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
      )
      .pipe(
        timeout(5000),
        map((result: { image?: { small?: string; large?: string } }) => {
          const url = result.image?.small || result.image?.large || '';
          this.coinImageCache[coinSymbol.toLowerCase()] = url;
          return url;
        }),
        catchError(() => {
          const staticUrl = this.staticImages[coinSymbol.toLowerCase()] || '';
          if (staticUrl) this.coinImageCache[coinSymbol.toLowerCase()] = staticUrl;
          return of(staticUrl);
        })
      );
  }

  deleteCoin(coin: Pick<CoinTransaction, 'symbol'>): void {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins().filter((c: CoinTransaction) => c.symbol !== coin.symbol);
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

  deleteTransaction(key: string): void {
    if (this.isDemoMode) {
      const coins = this.getDemoCoins().filter((c: CoinTransaction) => c.key !== key);
      this.saveDemoCoins(coins);
      return;
    }
    this.coinCollection.doc(key).delete();
  }

  getCoins(): Observable<CoinTransaction[]> {
    if (this.isDemoMode) {
      // Auto-seed demo data if empty
      if (this.getDemoCoins().length === 0) {
        this.enableDemoMode();
      }
      this.demoCoinsSource.next(this.getDemoCoins());
      return this.demoCoinsSource.asObservable();
    }
    return this.coinCollection.valueChanges();
  }

  getCoinsPayload(): Observable<CoinPayloadSnapshot[]> {
    if (this.isDemoMode) {
      if (this.getDemoCoins().length === 0) {
        this.enableDemoMode();
      }
      this.demoCoinsSource.next(this.getDemoCoins());
      return this.demoCoinsSource.pipe(map((coins: CoinTransaction[]) =>
        coins.map((c: CoinTransaction, i: number) => ({
          payload: { doc: { id: c.key || `demo_${i}`, data: () => c } }
        }))
      ));
    }
    return this.coinCollection.snapshotChanges();
  }

  insertCoin(coin: Pick<CoinTransaction, 'amount' | 'priceBought' | 'date' | 'exchange'>, name: string): void {
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
