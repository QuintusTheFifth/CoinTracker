import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { AddCoinComponent } from './add-coin.component';

describe('AddCoinComponent', () => {
  function createComponent(): AddCoinComponent {
    const fb = new FormBuilder();
    const calls = { inserts: 0, updates: 0, closes: 0 };
    const form = fb.group({
      $key: [null],
      symbol: [''],
      amount: ['', [Validators.required, Validators.min(0.00000001)]],
      priceBought: [''],
      date: [''],
      exchange: ['']
    });
    const coinService = {
      form,
      currentMessage: new BehaviorSubject(''),
      setCoinSymbol: () => null,
      getCoinSymbol: () => '',
      getValidCoins: () => [{ symbol: 'BTC', name: 'bitcoin', icon: '' }],
      coinIdMap: { btc: 'bitcoin' },
      coinImageCache: {},
      getCoinSymbols: () => of([]),
      initializeFormGroup: () => null,
      insertCoin: () => calls.inserts++,
      updateCoin: () => calls.updates++
    } as any;
    const component = new AddCoinComponent(
      coinService,
      { close: () => calls.closes++ } as any,
      fb,
      { success: () => null, warn: () => null } as any
    );
    (component as any).calls = calls;
    return component;
  }

  it('should create', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('validates known coin symbols', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.checkCoinSymbol('BTC')).toBe(true);
    expect(component.checkCoinSymbol('NOPE')).toBe(false);
    expect(component.checkCoinSymbol('')).toBe(false);
    component.ngOnDestroy();
  });

  it('does not submit a blank add-coin symbol', () => {
    const component = createComponent();
    component.ngOnInit();
    component.coinService.form.patchValue({ amount: 1 });
    component.coinName.setValue('');

    component.onSubmit();

    expect((component as any).calls.inserts).toBe(0);
    expect((component as any).calls.closes).toBe(0);
    expect(component.coinName.touched).toBe(true);
    component.ngOnDestroy();
  });

  it('submits valid known symbols', () => {
    const component = createComponent();
    component.ngOnInit();
    component.coinService.form.patchValue({ amount: 1 });
    component.coinName.setValue('BTC');

    component.onSubmit();

    expect((component as any).calls.inserts).toBe(1);
    expect((component as any).calls.closes).toBe(1);
    component.ngOnDestroy();
  });
});
