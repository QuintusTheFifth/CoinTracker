import { Component, OnInit, Input } from '@angular/core';
import { CoinsService } from '../services/coin.data.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-coin-graph',
  templateUrl: './coin-graph.component.html',
  styleUrls: ['./coin-graph.component.css'],
})
export class CoinGraphComponent implements OnInit {
  chart = [];
  overviewChart = [];
  loading: boolean = true;

  @Input() coinSymbol: string;

  constructor(private _coinService: CoinsService) {}

  message: string;
  bigChart: boolean;
  period: number;

  ngOnInit(): void {
    this._coinService.currentMessage.subscribe(
      (message) => (this.message = message)
    );
    this._coinService.currentBigChart.subscribe(
      (bigChart) => (this.bigChart = bigChart)
    );
    this._coinService.currentPeriod.subscribe(
      // (period)=>(this.period=period)
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
    this.chart = [];
    var coinName = this.coinSymbol;

    this.coinName = coinName;
    if (!coinName) { this.loading = false; return; }
    this._coinService.weekData(coinName).subscribe((res) => {
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
              borderColor: '#3cba9f',
              fill: false,
            },
          ],
        },
        options: {
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
              },
            ],
            yAxes: [
              {
                display: false,
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
    this.overviewChart = [];
    var coinName = this.coinSymbol;
    this.coinName = coinName;
    if (!coinName) { this.loading = false; return; }
    this._coinService.bigData(coinName, this.period).subscribe((res) => {
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
              borderColor: '#3cba9f',
              fill: true,
            },
          ],
        },
        options: {
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
              },
            ],
            yAxes: [
              {
                display: true,
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
}

// }
