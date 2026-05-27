import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Resolve themed colors from CSS custom properties so charts track light/dark.
function themeColors() {
  const css = getComputedStyle(document.body);
  const read = (name: string, fallback: string) =>
    (css.getPropertyValue(name) || '').trim() || fallback;
  return {
    accent: read('--accent', '#f7931a'),
    green: read('--green', '#4cc38a'),
    red: read('--red', '#e5484d'),
    grid: read('--border', '#23262b'),
    tick: read('--text-muted', '#868d97'),
  };
}

function hexToRgb(hex: string): string {
  const h = (hex || '').replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (isNaN(n) || full.length !== 6) { return '247, 147, 26'; }
  // tslint:disable-next-line:no-bitwise
  return ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255);
}

// Soft vertical fill under the line, fading to transparent.
function fillGradient(canvasId: string, hex: string, topAlpha: number): any {
  const rgb = hexToRgb(hex);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas || !canvas.getContext) { return 'rgba(' + rgb + ', ' + topAlpha + ')'; }
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 160);
  gradient.addColorStop(0, 'rgba(' + rgb + ', ' + topAlpha + ')');
  gradient.addColorStop(1, 'rgba(' + rgb + ', 0.00)');
  return gradient;
}

@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css'],
})
export class CoinGraphComponent implements OnInit, OnDestroy {
  chart: Chart | any[] = [];
  overviewChart: Chart | any[] = [];
  loading: boolean = true;

  @Input() coinSymbol: string;

  private destroy$ = new Subject<void>();

  constructor(private _coinService: CoinsService, private cdr: ChangeDetectorRef) {}

  message: string;
  bigChart: boolean;
  period: number;

  ngOnInit(): void {
    this._coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (message) => (this.message = message)
    );
    // Period first: its initial emission must not trigger a render before
    // bigChart is known (avoids a double draw on init).
    this._coinService.currentPeriod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (period) => {
        this.period = period;
        if (this.bigChart) {
          this.render();
        }
      }
    );
    this._coinService.currentBigChart.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (bigChart) => (this.bigChart = bigChart)
    );
    // Initial draw once message / period / bigChart are resolved.
    this.render();
  }

  private render(): void {
    if (this.bigChart) {
      this.getBigData();
    } else {
      this.getWeekData();
    }
  }

  coinName;

  setBigChart(num) {
    this.bigChart = num;
  }

  getBigChart() {
    return this.bigChart;
  }

  getWeekData() {
    if (this.chart instanceof Chart) { this.chart.destroy(); }
    this.chart = [];
    var coinName = this.coinSymbol || this.message;

    this.coinName = coinName;
    if (!coinName) { this.loading = false; return; }
    this._coinService.weekData(coinName).pipe(
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      let allDates = [];
      let data = [];
      const prices = res['prices'] || [];
      for (let i = 0; i < prices.length; i++) {
        if (prices[i][1] != 0) {
          data.push(prices[i][1]);
          allDates.push(prices[i][0]);
        }
      }

      let coinDates = [];

      allDates.forEach((res) => {
        let jsDate = new Date(res);
        coinDates.push(
          jsDate.toLocaleTimeString('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        );
      });

      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        const c = themeColors();
        const trend = (data.length > 1 ? (data[data.length - 1] >= data[0]) : true) ? c.green : c.red;
        this.chart = new Chart(coinName, {
        type: 'line',
        data: {
          labels: coinDates,
          datasets: [
            {
              data: data,
              borderColor: trend,
              backgroundColor: fillGradient(coinName, trend, 0.12),
              borderWidth: 1.25,
              lineTension: 0.4,
              cubicInterpolationMode: 'monotone',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: false },
          elements: { point: { radius: 0 }, line: { borderJoinStyle: 'round', borderCapStyle: 'round' } },
          tooltips: { enabled: false },
          hover: { mode: null },
          layout: { padding: 1 },
          scales: {
            xAxes: [{ display: false, gridLines: { display: false } }],
            yAxes: [{ display: false, gridLines: { display: false } }],
          },
        },
      });
      }, 0);
    },
    (error) => {
      this.loading = false;
    });
  }

  getBigData() {
    if (this.overviewChart instanceof Chart) { this.overviewChart.destroy(); }
    this.overviewChart = [];
    var coinName = this.coinSymbol || this.message;
    this.coinName = coinName;
    if (!coinName) { this.loading = false; return; }
    this._coinService.bigData(coinName, this.period).pipe(
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      let allDates = [];
      let data = [];
      const prices = res['prices'] || [];
      for (let i = 0; i < prices.length; i++) {
        if (prices[i][1] != 0) {
          data.push(prices[i][1]);
          allDates.push(prices[i][0]);
        }
      }

      let coinDates = [];

      allDates.forEach((res) => {
        let jsDate = new Date(res);
        coinDates.push(
          jsDate.toLocaleDateString('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        );
      });

      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        const c = themeColors();
        this.overviewChart = new Chart(coinName, {
        type: 'line',
        data: {
          labels: coinDates,
          datasets: [
            {
              data: data,
              borderColor: c.accent,
              backgroundColor: fillGradient(coinName, c.accent, 0.14),
              borderWidth: 1.75,
              lineTension: 0.4,
              cubicInterpolationMode: 'monotone',
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: c.accent,
              pointHoverBorderColor: '#0a0b0d',
              pointHoverBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: false },
          elements: { point: { radius: 0 }, line: { borderJoinStyle: 'round', borderCapStyle: 'round' } },
          tooltips: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(10, 11, 13, 0.94)',
            borderColor: c.grid,
            borderWidth: 1,
            titleFontColor: '#9ba1a8',
            titleFontFamily: 'Inter, sans-serif',
            titleFontSize: 11,
            bodyFontColor: '#ededed',
            bodyFontFamily: 'Inter, sans-serif',
            bodyFontStyle: '600',
            bodyFontSize: 13,
            xPadding: 10,
            yPadding: 8,
            cornerRadius: 8,
            displayColors: false,
            caretSize: 5,
          },
          hover: { mode: 'index', intersect: false },
          scales: {
            xAxes: [
              {
                type: 'category',
                display: true,
                gridLines: { display: false, drawBorder: false },
                ticks: {
                  fontColor: '#a3a9b0', fontFamily: 'Inter, sans-serif', fontSize: 12,
                  maxRotation: 0, autoSkip: true, maxTicksLimit: 6, padding: 8,
                },
              },
            ],
            yAxes: [
              {
                display: true,
                position: 'right',
                gridLines: { color: 'rgba(255,255,255,0.05)', zeroLineColor: 'rgba(255,255,255,0.05)', drawBorder: false },
                ticks: {
                  fontColor: '#a3a9b0', fontFamily: 'Inter, sans-serif', fontSize: 12,
                  maxTicksLimit: 5, padding: 10,
                  callback: function(value: any) {
                    const n = Number(value);
                    if (!isFinite(n)) { return value; }
                    if (Math.abs(n) >= 1000) { return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k'; }
                    return n >= 1 ? n.toFixed(0) : n.toPrecision(2);
                  },
                },
              },
            ],
          },
        },
      });
      }, 0);
    },
    (error) => {
      this.loading = false;
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart instanceof Chart) { this.chart.destroy(); }
    if (this.overviewChart instanceof Chart) { this.overviewChart.destroy(); }
  }
}
