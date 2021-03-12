import { Component, OnInit } from '@angular/core';
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
    var coinName = this._coinService.getCoinSymbol();

    this.coinName = coinName;
    this._coinService.weekData(coinName).subscribe((res) => {
      let allDates = [];
      let data = [];
      for (let i = 0; i <= 7; i++) {
        if (res['Data'].Data[i].high != 0) {
          data.push(res['Data'].Data[i].high);
          allDates.push(res['Data'].Data[i].time);
        }
      }

      let coinDates = [];

      allDates.forEach((res) => {
        let jsDate = new Date(res * 1000);
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
    });
  }

  getBigData() {
    this.overviewChart = [];
    var coinName = this._coinService.getCoinSymbol();
    this.coinName = coinName;
    this._coinService.bigData(coinName, this.period).subscribe((res) => {
      let allDates = [];
      let data = [];
      for (let i = 0; i <= this.period; i++) {
        if (res['Data'].Data[i].high != 0) {
          data.push(res['Data'].Data[i].high);
          allDates.push(res['Data'].Data[i].time);
        }
      }

      let coinDates = [];

      allDates.forEach((res) => {
        let jsDate = new Date(res * 1000);
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
    });
  }
}

// }
