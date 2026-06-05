import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { Chart } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Dark theme chart area background plugin
const darkBackgroundPlugin = {
  id: 'darkBackground',
  beforeDraw: function(chart) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;
    ctx.save();
    ctx.fillStyle = 'rgba(28, 35, 51, 0.9)';
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  }
};

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
  chartLow = 0;
  chartHigh = 0;
  chartLatest = 0;
  chartStart = '';
  chartEnd = '';

  ngOnInit(): void {
    this._coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (bigChart) => {
        const changed = this.bigChart !== bigChart;
        this.bigChart = bigChart;
        if (changed && this.coinName) {
          if (bigChart) {
            this.getBigData();
          } else {
            this.getWeekData();
          }
        }
      }
    );
    this._coinService.currentPeriod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (period) => {
        this.period = period;
        if (this.bigChart) {
          this.getBigData();
        }
      }
    );
    if (!this.bigChart) {
      this.getWeekData();
    } else {
      this.getBigData();
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
        this.chart = new Chart(coinName, {
        type: 'line',
        data: {
          labels: coinDates,
          datasets: [
            {
              data: data,
              borderColor: '#f7931a',
              backgroundColor: 'rgba(247, 147, 26, 0.08)',
              fill: true,
            },
          ],
        },
        options: {
          plugins: [darkBackgroundPlugin],
          layout: {
            padding: { left: 8, right: 18, top: 8, bottom: 0 },
          },
          legend: {
            display: false,
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          tooltips: { enabled: false },
          hover: { mode: null },
          scales: {
            xAxes: [
              {
                display: false,
                gridLines: {
                  color: 'rgba(139, 148, 158, 0.22)',
                },
                ticks: {
                  fontColor: '#c9d1d9',
                },
              },
            ],
            yAxes: [
              {
                display: false,
                gridLines: {
                  color: 'rgba(139, 148, 158, 0.22)',
                },
                ticks: {
                  fontColor: '#c9d1d9',
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

  getBigData() {
    if (this.overviewChart instanceof Chart) { this.overviewChart.destroy(); }
    this.overviewChart = [];
    var coinName = this.coinSymbol || this.message;
    this.coinName = coinName;
    if (!coinName) { this.loading = false; return; }
    const fallbackPrice = this._coinService.getFallbackPrice(coinName);
    if (fallbackPrice) {
      this.chartLatest = fallbackPrice;
      this.chartHigh = fallbackPrice;
      this.chartLow = fallbackPrice;
      this.chartStart = 'Fallback';
      this.chartEnd = 'Live data pending';
    }
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
          jsDate.toISOString().slice(0, 10)
        );
      });

      this.chartLow = data.length ? Math.min(...data) : 0;
      this.chartHigh = data.length ? Math.max(...data) : 0;
      this.chartLatest = data[data.length - 1] || fallbackPrice || 0;
      this.chartStart = coinDates[0] || '';
      this.chartEnd = coinDates[coinDates.length - 1] || '';

      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.overviewChart = new Chart(coinName, {
        type: 'line',
        data: {
          labels: coinDates,
          datasets: [
            {
              data: data,
              borderColor: '#f7931a',
              backgroundColor: 'rgba(247, 147, 26, 0.06)',
              borderWidth: 2,
              fill: false,
              lineTension: 0.22,
              pointHitRadius: 12,
            },
          ],
        },
        options: {
          plugins: [darkBackgroundPlugin],
          legend: {
            display: false,
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          tooltips: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(13, 17, 23, 0.95)',
            borderColor: '#f7931a',
            borderWidth: 1,
            titleFontColor: '#ffffff',
            bodyFontColor: '#ffffff',
            callbacks: {
              label: (tooltipItem) => `${coinName}: ${Number(tooltipItem.yLabel || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            }
          },
          hover: { mode: 'nearest', intersect: false },
          scales: {
            xAxes: [
              {
                display: true,
                type: 'time',
                time: {
                  unit: 'month',
                },
                scaleLabel: {
                  display: true,
                  labelString: 'Date',
                  fontColor: '#f0f6fc',
                  fontSize: 13,
                },
                gridLines: {
                  color: 'rgba(201, 209, 217, 0.24)',
                  zeroLineColor: 'rgba(201, 209, 217, 0.45)',
                },
                ticks: {
                  fontColor: '#f0f6fc',
                  fontSize: 12,
                  maxTicksLimit: 6,
                },
              },
            ],
            yAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Price',
                  fontColor: '#f0f6fc',
                  fontSize: 13,
                },
                gridLines: {
                  color: 'rgba(201, 209, 217, 0.24)',
                  zeroLineColor: 'rgba(201, 209, 217, 0.45)',
                },
                ticks: {
                  fontColor: '#f0f6fc',
                  fontSize: 12,
                  callback: (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 }),
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
