import { BehaviorSubject, of } from 'rxjs';
import { CoinListComponent } from './coin-list.component';

describe('CoinListComponent', () => {
  function createComponent(): CoinListComponent {
    const coinService = {
      addCoinsToList: () => null,
      currentValuta: new BehaviorSubject('EUR'),
      currentMarketStatus: new BehaviorSubject('Live market data'),
      currentMessage: new BehaviorSubject(''),
      changeMessage: () => null,
      changeBigChart: () => null,
      getCoins: () => of([]),
      enableDemoMode: () => null,
      getCoinPrice: () => of({ bitcoin: { eur: 100 } }),
      coinIdMap: { btc: 'bitcoin' },
      getCoinImageUrl: () => of(''),
      changeValuta: () => null,
      changeCoinName: () => null,
      deleteCoin: () => null,
      setSymbolInit: () => null,
      changePeriod: () => null
    } as any;
    return new CoinListComponent(coinService, { open: () => null } as any, { warn: () => null } as any, { navigate: () => null } as any);
  }

  it('should create', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('calculates portfolio total', () => {
    const component = createComponent();
    expect(component.berekenEindTotaal([{ amount: 2, price: 50 }, { amount: 1, price: 75 }])).toBe(175);
  });
});
