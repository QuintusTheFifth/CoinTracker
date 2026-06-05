import { BehaviorSubject, of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';
import { CoinGraphComponent } from './coin-graph.component';

describe('CoinGraphComponent', () => {
  function createComponent(serviceOverrides: any = {}): { component: CoinGraphComponent; service: any } {
    const coinService = {
      currentMessage: new BehaviorSubject('BTC'),
      currentBigChart: new BehaviorSubject(false),
      currentPeriod: new BehaviorSubject(7),
      weekData: () => of({ prices: [] }),
      bigData: () => of({ prices: [[Date.now() - 86400000, 100], [Date.now(), 125]] }),
      getFallbackPrice: () => 120,
      ...serviceOverrides
    } as any;
    return { component: new CoinGraphComponent(coinService, { detectChanges: () => null } as any), service: coinService };
  }

  it('should create', () => {
    expect(createComponent().component).toBeTruthy();
  });

  it('toggles big chart state', () => {
    const { component } = createComponent();
    component.setBigChart(true);
    expect(component.getBigChart()).toBe(true);
  });

  it('loads big chart metrics when big-chart mode turns on after init', fakeAsync(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'BTC';
    document.body.appendChild(canvas);
    const bigChart$ = new BehaviorSubject(false);
    const { component } = createComponent({ currentBigChart: bigChart$ });
    component.ngOnInit();

    bigChart$.next(true);

    expect(component.chartLatest).toBe(125);
    expect(component.chartHigh).toBe(125);
    expect(component.chartLow).toBe(100);
    tick();
    document.body.removeChild(canvas);
  }));
});
