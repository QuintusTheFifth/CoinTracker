import { of } from 'rxjs';
import { CoinsService } from './coin.data.service';

describe('CoinsService', () => {
  let service: CoinsService;

  beforeEach(() => {
    localStorage.clear();
    const http = { get: () => of([]) } as any;
    const firestore = { collection: () => ({ valueChanges: () => of([]), snapshotChanges: () => of([]) }) } as any;
    const auth = { getUID: () => null } as any;
    service = new CoinsService(http, firestore, auth);
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normalizes and publishes currency changes', (done) => {
    service.changeValuta('USD');
    service.currentValuta.subscribe((valuta) => {
      expect(valuta).toBe('USD');
      expect(service.getValuta()).toBe('USD');
      done();
    });
  });

  it('streams demo coin changes after inserts', (done) => {
    service.enableDemoMode();
    const seen: any[][] = [];

    service.getCoins().subscribe((coins: any[]) => {
      seen.push(coins);
      if (seen.length === 2) {
        expect(seen[1].length).toBe(seen[0].length + 1);
        expect(seen[1][seen[1].length - 1].symbol).toBe('DOGE');
        done();
      }
    });

    service.insertCoin({ amount: 10, priceBought: 1, date: '2026-06-04', exchange: 'Binance' }, 'DOGE');
  });

  it('returns static coin icons immediately for common demo assets', (done) => {
    service.getCoinImageUrl('ETH').subscribe((url) => {
      expect(url).toContain('ethereum.png');
      done();
    });
  });

  it('preserves a transaction symbol when editing from the form value', () => {
    service.enableDemoMode();

    service.updateCoin({
      $key: 'demo_1',
      coinName: 'BTC',
      amount: 2,
      priceBought: 46000,
      date: '2026-06-05',
      exchange: 'Kraken'
    } as any);

    const coins = JSON.parse(localStorage.getItem('cointracker_demo_coins') || '[]');
    const btc = coins.find((coin: any) => coin.key === 'demo_1');
    expect(btc.symbol).toBe('BTC');
    expect(btc.amount).toBe(2);
  });

  it('seeds demo payload transactions when demo flag is present', (done) => {
    localStorage.setItem('demoMode', '1');
    service.getCoinsPayload().subscribe((payloads: any[]) => {
      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads.some((p) => p.payload.doc.data().symbol === 'BTC')).toBeTrue();
      done();
    });
  });
});
