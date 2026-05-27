import { Component, OnInit, OnDestroy, Input } from '@angular/core';
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

  constructor(private _coinService: CoinsService) {}

  message: string;
  bigChart: boolean;
  period: number;

  ngOnInit(): void {
    this._coinService.currentMessage.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (bigChart) => (this.bigChart = bigChart)
    );
    this._coinService.currentPeriod.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (period) => {
        this.period = period;
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
    var coinName = this.coinSymbol;

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
                  color: '#30363d',
                },
                ticks: {
                  fontColor: '#8b949e',
                },
              },
            ],
            yAxes: [
              {
                display: false,
                gridLines: {
                  color: '#30363d',
                },
                ticks: {
                  fontColor: '#8b949e',
                },
              },
            ],
          },
        },
      });
      this.loading = false;
    },
    (error) => {
      this.loading = false;
    });
  }

  getBigData() {
    if (this.overviewChart instanceof Chart) { this.overviewChart.destroy(); }
    this.overviewChart = [];
    var coinName = this.coinSymbol;
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

      this.overviewChart = new Chart(coinName, {
        type: 'line',
        data: {
          labels: coinDates,
          datasets: [
            {
              data: data,
              borderColor: '#f7931a',
              backgroundColor: 'rgba(247, 147, 26, 0.12)',
              fill: true,
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
          tooltips: { enabled: true },
          //hover:{mode:null},
          scales: {
            xAxes: [
              {
                type: 'time',
                time: {
                  unit: 'month',
                },
                gridLines: {
                  color: '#30363d',
                },
                ticks: {
                  fontColor: '#8b949e',
                },
              },
            ],
            yAxes: [
              {
                display: true,
                gridLines: {
                  color: '#30363d',
                },
                ticks: {
                  fontColor: '#8b949e',
                },
              },
            ],
          },
        },
      });
      this.loading = false;
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
