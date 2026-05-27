import { Injectable } from '@angular/core';
import { throwError, Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as _ from 'lodash';
import { map, catchError, timeout } from 'rxjs/operators';
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
  // Emits the searchable coin universe as it loads, so the add picker updates live.
  coinsSubject = new BehaviorSubject<Coin[]>([]);
  private universeLoaded = false;

  private bigChartSource = new BehaviorSubject<boolean>(false);
  currentBigChart = this.bigChartSource.asObservable();

  private messageSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();

  private periodSource = new BehaviorSubject<number>(90);
  currentPeriod = this.periodSource.asObservable();

  private valutaSource = new BehaviorSubject<string>(localStorage.getItem('cointracker_valuta') || 'EUR');
  currentValuta = this.valutaSource.asObservable();

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
  coinIdMapSubject = new BehaviorSubject<Record<string, string>>({});

  // Emits whenever demo-mode coins change, so views update live (like Firestore valueChanges).
  private demoChange$ = new BehaviorSubject<number>(0);

  // CoinGecko image cache: symbol.toLowerCase() -> image_url
  coinImageCache: Record<string, string> = {};

  // Batched market data from /coins/markets, keyed by lowercase symbol.
  // One call returns price + 24h change + 7-day sparkline + image for many coins,
  // which avoids the per-coin request burst that triggers CoinGecko rate limits.
  marketData: Record<string, { price: number; change24h: number; sparkline: number[] }> = {};

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
    btc: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
    eth: 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
    sol: 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
    ada: 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
    usdt: 'https://coin-images.coingecko.com/coins/images/325/small/tether.png',
    bnb: 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    xrp: 'https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    usdc: 'https://coin-images.coingecko.com/coins/images/6319/small/usdc.png',
    doge: 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
    dot: 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
  };

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
    // Keep both the reactive stream AND the plain property in sync — the
    // price/chart API calls read this.valuta directly for vs_currency.
    this.valuta = valuta;
    try { localStorage.setItem('cointracker_valuta', valuta); } catch (e) {}
    // Prices and chart history are currency-specific — drop the caches so the
    // next fetch returns values in the newly selected currency (not stale ones).
    this.marketData = {};
    this.chartCache = {};
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
  valuta: string = localStorage.getItem('cointracker_valuta') || 'EUR';

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

  /** Save coins to localStorage (demo mode) and notify subscribers */
  private saveDemoCoins(coins: any[]): void {
    localStorage.setItem(this.demoKey, JSON.stringify(coins));
    this.demoChange$.next(Date.now());
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
    if (!coinSymbol) return '';
    return this.coinIdMap[coinSymbol.toLowerCase()] || '';
  }

  /** Deterministic PRNG (mulberry32) so fallback charts are stable across refreshes. */
  private seededRandom(seed: number): () => number {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private hashStr(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h;
  }

  /**
   * Deterministic synthetic price series for the offline fallback. Same symbol +
   * seed always yields the same shape (no flickering colours on refresh), while a
   * different `seed` (e.g. the period) produces a distinct curve so timeframe
   * changes are visible. Ends at the current static price.
   */
  private synthSeries(symbol: string, basePrice: number, points: number, spanMs: number, seed: number): number[][] {
    const rng = this.seededRandom(this.hashStr(symbol) + seed);
    const startFactor = 0.78 + rng() * 0.44; // 0.78–1.22 of current price
    const startVal = basePrice * startFactor;
    const now = Date.now();
    const out: number[][] = [];
    for (let i = 0; i < points; i++) {
      const t = points > 1 ? i / (points - 1) : 1;
      const trend = startVal * (1 - t) + basePrice * t;       // glide start -> now
      const noise = (rng() - 0.5) * basePrice * 0.05;          // deterministic wobble
      const val = Math.max(basePrice * 0.05, trend + noise);
      out.push([now - (points - i) * (spanMs / points), val]);
    }
    out[out.length - 1][1] = basePrice; // anchor the latest point to the current price
    return out;
  }

  /** Merge a /coins/markets response into the caches. */
  private ingestMarkets(rows: any[]): void {
    (rows || []).forEach((r: any) => {
      const sym = (r.symbol || '').toLowerCase();
      if (!sym) { return; }
      this.marketData[sym] = {
        price: r.current_price,
        change24h: r.price_change_percentage_24h,
        sparkline: (r.sparkline_in_7d && r.sparkline_in_7d.price) || [],
      };
      if (r.image) { this.coinImageCache[sym] = r.image; }
      if (r.id) { this.coinIdMap[sym] = r.id; }
    });
  }

  /**
   * Batch-load price, 24h change, sparkline and image for the given symbols via a
   * single /coins/markets call. Returns true on success. This is the primary data
   * path for the dashboard — one request instead of ~4 per coin.
   */
  loadMarkets(symbols: string[]): Observable<boolean> {
    const seen: Record<string, boolean> = {};
    const ids = (symbols || [])
      .map((s) => this.resolveCoinId(s))
      .filter((id) => id && !seen[id] && (seen[id] = true));
    if (!ids.length) { return of(false); }
    const vs = (this.valuta || 'eur').toLowerCase();
    return this._http
      .get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&ids=${ids.join(',')}&sparkline=true&price_change_percentage=24h&per_page=250`)
      .pipe(
        timeout(9000),
        map((rows: any[]) => { this.ingestMarkets(rows); return true; }),
        // CoinGecko unavailable (CORS / rate-limit) → real prices from Coinbase.
        catchError(() => this.loadMarketsViaCoinbase(symbols, vs))
      );
  }

  /** Load the top coins (by market cap) once for autocomplete icons + universe. */
  loadTopMarkets(): void {
    const vs = (this.valuta || 'eur').toLowerCase();
    this._http
      .get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=250&page=1&sparkline=false`)
      .pipe(timeout(9000), catchError(() => of([])))
      .subscribe((rows: any[]) => {
        this.ingestMarkets(rows);
        (rows || []).forEach((r: any) => {
          const symU = (r.symbol || '').toUpperCase();
          if (symU && !this.coins.find((c) => c.symbol === symU)) {
            this.coins.push({ icon: '', symbol: symU, name: r.name });
          }
        });
        this.coinIdMapSubject.next({ ...this.coinIdMap });
        this.coinsSubject.next(this.coins.slice());
      });
  }

  /** Best available icon for a symbol: live CoinGecko image, then a known static
   *  image, then the bundled SVG (template falls back to add.png on error). */
  iconFor(symbol: string): string {
    const s = (symbol || '').toLowerCase();
    return this.coinImageCache[s] || this.staticImages[s] || ('assets/svg/icon/' + s + '.svg');
  }

  /** Fallback price from Coinbase (keyless, EUR/USD pairs) when CoinGecko is unavailable. */
  private coinbasePrice(symbol: string, vs: string): Observable<number | null> {
    const product = (symbol || '').toUpperCase() + '-' + (vs || 'EUR').toUpperCase();
    return this._http
      .get(`https://api.exchange.coinbase.com/products/${product}/ticker`)
      .pipe(
        timeout(6000),
        map((t: any) => (t && t.price ? parseFloat(t.price) : null)),
        catchError(() => of(null))
      );
  }

  /** Fallback price + 24h change from Coinbase /stats (keyless). */
  private coinbaseStats(symbol: string, vs: string): Observable<{ price: number; change24h: number } | null> {
    const product = (symbol || '').toUpperCase() + '-' + (vs || 'EUR').toUpperCase();
    return this._http
      .get(`https://api.exchange.coinbase.com/products/${product}/stats`)
      .pipe(
        timeout(6000),
        map((s: any) => {
          if (!s || s.last == null) { return null; }
          const last = parseFloat(s.last);
          const open = parseFloat(s.open);
          const change = open && isFinite(open) ? ((last - open) / open) * 100 : null;
          return { price: last, change24h: change } as any;
        }),
        catchError(() => of(null))
      );
  }

  /** Batch-load holdings prices/24h from Coinbase when CoinGecko is unavailable (e.g. CORS/rate-limit). */
  private loadMarketsViaCoinbase(symbols: string[], vs: string): Observable<boolean> {
    const uniq = Array.from(new Set((symbols || []).map((s) => (s || '').toLowerCase()))).filter(Boolean);
    if (!uniq.length) { return of(false); }
    return forkJoin(uniq.map((sym) => this.coinbaseStats(sym, vs))).pipe(
      map((results: any[]) => {
        let any = false;
        results.forEach((r, i) => {
          if (r && r.price != null) {
            any = true;
            const sym = uniq[i];
            this.marketData[sym] = {
              price: r.price,
              change24h: r.change24h,
              sparkline: (this.marketData[sym] && this.marketData[sym].sparkline) || [],
            };
          }
        });
        return any;
      }),
      catchError(() => of(false))
    );
  }

  /** Fallback OHLC history from Coinbase (keyless) → real chart data, not synthetic. */
  private coinbaseCandles(symbol: string, days: number, vs: string): Observable<any> {
    const product = (symbol || '').toUpperCase() + '-' + (vs || 'EUR').toUpperCase();
    const gran = days <= 31 ? 21600 : 86400; // 6h for ≤1 month, otherwise daily
    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    const url = `https://api.exchange.coinbase.com/products/${product}/candles?granularity=${gran}&start=${start.toISOString()}&end=${end.toISOString()}`;
    return this._http.get(url).pipe(
      timeout(8000),
      map((rows: any[]) => {
        if (!Array.isArray(rows) || !rows.length) { throw new Error('no candles'); }
        // Coinbase rows: [time(s), low, high, open, close, volume], newest first.
        const prices = rows
          .map((r: any) => [r[0] * 1000, r[4]])
          .sort((a: any, b: any) => a[0] - b[0]);
        return { prices };
      })
    );
  }

  /** Get current price for one coin (via /coins/markets, which is reliable on the free tier). */
  getCoinPrice(coinSymbol: string) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    const sym = coinSymbol.toLowerCase();
    const vs = (this.valuta || 'eur').toLowerCase();
    const wrap = (price: number) => { const r: any = {}; r[coinId] = {}; r[coinId][vs] = price; return r; };
    // Use the already-fetched batch price if we have it (avoids a redundant call).
    const cached = this.marketData[sym];
    if (cached && cached.price !== null && cached.price !== undefined) {
      return of(wrap(cached.price));
    }
    return this._http
      .get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&ids=${coinId}&sparkline=false`)
      .pipe(
        timeout(8000),
        map((rows: any[]) => {
          const row = rows && rows[0];
          if (row) {
            const s = (row.symbol || '').toLowerCase();
            if (row.image) { this.coinImageCache[s] = row.image; }
            return wrap(row.current_price);
          }
          return wrap(this.staticPrices[sym] !== undefined ? this.staticPrices[sym] : 0);
        }),
        catchError(() =>
          // Coinbase fallback, then static.
          this.coinbasePrice(coinSymbol, vs).pipe(
            map((p) => wrap(p !== null
              ? p
              : (this.staticPrices[sym] !== undefined ? this.staticPrices[sym] : 0)))
          )
        )
      );
  }

  /** Get 7-day data for the mini graph — reuses the cached sparkline when available. */
  weekData(coinSymbol: string) {
    const sym = coinSymbol.toLowerCase();
    const md = this.marketData[sym];
    if (md && md.sparkline && md.sparkline.length) {
      const now = Date.now();
      const n = md.sparkline.length;
      const prices = md.sparkline.map((p, i) => [now - (n - 1 - i) * 3600000, p]);
      return of({ prices });
    }
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    return this._http
      .get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${(this.valuta || 'eur').toLowerCase()}&days=7`
      ).pipe(
        timeout(6000),
        catchError(() =>
          // Coinbase fallback, then deterministic synthetic.
          this.coinbaseCandles(coinSymbol, 7, this.valuta || 'eur').pipe(
            catchError(() => {
              const price = this.staticPrices[sym];
              if (price !== undefined) {
                return of({ prices: this.synthSeries(sym, price, 50, 7 * 86400000, 7) });
              }
              return throwError(() => new Error(`No static fallback for ${coinSymbol}`));
            })
          )
        )
      );
  }

  // Cache of successful market_chart responses, keyed by id_days_currency, so
  // switching periods / revisiting a coin doesn't refetch (fewer rate limits).
  private chartCache: Record<string, number[][]> = {};

  /** Get period market chart data for the big graph. CoinGecko's free tier only
   *  serves up to 365 days of history (longer ranges 401), so we cap days here. */
  bigData(coinSymbol: string, period: number) {
    const coinId = this.resolveCoinId(coinSymbol);
    if (!coinId) {
      return throwError(() => new Error(`Unknown coin symbol: ${coinSymbol}`));
    }
    const sym = coinSymbol.toLowerCase();
    const vs = (this.valuta || 'eur').toLowerCase();
    const days = Math.min(365, Math.max(1, Number(period) || 90));
    const key = `${coinId}_${days}_${vs}`;
    if (this.chartCache[key]) {
      return of({ prices: this.chartCache[key] });
    }
    return this._http
      .get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vs}&days=${days}`)
      .pipe(
        timeout(8000),
        map((res: any) => {
          if (res && res.prices && res.prices.length) { this.chartCache[key] = res.prices; }
          return res;
        }),
        catchError(() =>
          // Coinbase fallback (real OHLC), then deterministic synthetic.
          this.coinbaseCandles(coinSymbol, days, vs).pipe(
            map((res: any) => { if (res && res.prices && res.prices.length) { this.chartCache[key] = res.prices; } return res; }),
            catchError(() => {
              const price = this.staticPrices[sym] !== undefined
                ? this.staticPrices[sym]
                : (this.marketData[sym] && this.marketData[sym].price);
              if (price) {
                const pts = Math.min(120, Math.max(60, Math.round(days / 3)));
                return of({ prices: this.synthSeries(sym, price, pts, days * 86400000, days) });
              }
              return throwError(() => new Error(`No static fallback for ${coinSymbol}`));
            })
          )
        )
      );
  }

  counter = 0;
  addCoinsToList() {
    if (this.universeLoaded) { return; }
    // Full searchable universe (ids + names) so users can add most coins.
    this.getCoinSymbols().subscribe({
      next: (coinsArr: any[]) => {
        if (coinsArr && coinsArr.length > 0) {
          this.universeLoaded = true;
          this.coins = coinsArr.map((c: any) => ({
            icon: '',
            symbol: (c.symbol || '').toUpperCase(),
            name: c.name,
          }));
          this.coinsSubject.next(this.coins);
        }
      },
      error: () => {} // Silently ignore — static coinIdMap already covers fallback
    });
  }

  private topMarketsLoaded = false;
  /** Lazily load top-coin icons/universe (called when the add picker opens) so it
   *  doesn't compete with the dashboard's holdings request and trip rate limits. */
  ensureTopMarkets(): void {
    if (this.topMarketsLoaded) { return; }
    this.topMarketsLoaded = true;
    this.loadTopMarkets();
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
        timeout(6000),
        map((result: any[]) => {
          // Only fill in symbols we don't already know — keeps the authoritative
          // ids for major coins (many obscure coins reuse popular symbols).
          result.forEach((coin) => {
            const s = (coin.symbol || '').toLowerCase();
            if (s && !this.coinIdMap[s]) { this.coinIdMap[s] = coin.id; }
          });
          this.coinIdMapSubject.next({ ...this.coinIdMap });
          return result;
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
        timeout(5000),
        map((result: any) => {
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

  getCoins(): Observable<any[]> {
    if (this.isDemoMode) {
      // Auto-seed demo data if empty
      if (this.getDemoCoins().length === 0) {
        this.enableDemoMode();
      }
      // Reactive: re-emits whenever demo coins change (add/edit/delete)
      return this.demoChange$.pipe(map(() => this.getDemoCoins()));
    }
    return this.coinCollection.valueChanges();
  }

  getCoinsPayload(): Observable<any[]> {
    if (this.isDemoMode) {
      return this.demoChange$.pipe(
        map(() => this.getDemoCoins().map((c: any, i: number) => ({
          payload: { doc: { id: c.key || `demo_${i}`, data: () => c } }
        })))
      );
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