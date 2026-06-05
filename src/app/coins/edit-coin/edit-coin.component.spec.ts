import { BehaviorSubject, of } from 'rxjs';
import { EditCoinComponent } from './edit-coin.component';

describe('EditCoinComponent', () => {
  function createComponent(): EditCoinComponent {
    const coinService = {
      currentMessage: new BehaviorSubject('BTC'),
      currentBigChart: new BehaviorSubject(false),
      currentValuta: new BehaviorSubject('EUR'),
      coinIdMap: { btc: 'bitcoin' },
      changeMessage: () => null,
      getCoinPrice: () => of({ bitcoin: { eur: 100 } }),
      getCoinImageUrl: () => of(''),
      getCoinsPayload: () => of([]),
      changeBigChart: () => null,
      setCoinSymbol: () => null,
      changePeriod: () => null,
      populateForm: () => null,
      deleteTransaction: () => null,
      setSymbolInit: () => null
    } as any;
    const route = { snapshot: { paramMap: { get: () => 'BTC' } } } as any;
    return new EditCoinComponent(coinService, { warn: () => null } as any, { close: () => null } as any, { open: () => null } as any, { navigate: () => null } as any, route);
  }

  it('should create', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('filters transactions by exchange', () => {
    const component = createComponent();
    component.transactionsList = [
      { symbol: 'BTC', amount: 1, date: '2026-01-15', exchange: 'Binance', priceBought: 45000, key: '1' },
      { symbol: 'ETH', amount: 2, date: '2026-01-16', exchange: 'Coinbase', priceBought: 2800, key: '2' }
    ];
    component.exchangeFilter = 'bin';
    expect(component.filteredTransactionsList.length).toBe(1);
  });
});
