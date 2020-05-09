import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Coin } from '../coin';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';

import { EMPTY } from 'rxjs';
import { CoinsService } from '../services/coin.data.service';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-add-coin',
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],
})
export class AddCoinComponent implements OnInit {
  coinSubmit: Coin;

  public filterCoinName: string;
  public filterCoin$ = new Subject<string>();

  PageTitle: string = 'Add a holding';
  public coin: FormGroup;

  constructor(
    public coinService: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>
  ) {
    this.filterCoin$
    .pipe(distinctUntilChanged(),
    map(val=>val.toLowerCase())
    )
    .subscribe(
      val=>this.filterCoinName = val);
  }

  /* _listFilter = '';
  get listFilter(): string {
    return this._listFilter;
  } */

  /* set listFilter(value: string) {
    this._listFilter = value;
    this.filteredCoins = this.listFilter
      ? this.performFilter(this.listFilter)
      : this.coins;
  } */

 /*  filteredCoins: ICoin[]; */
  coins: Coin[];

  coinSymbols: any[]= [];

  /* performFilter(filterBy: string): ICoin[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.coins.filter(
      (coin: ICoin) =>
        coin.coinName.toLocaleLowerCase().indexOf(filterBy) !== -1
    );
  } */

  ngOnInit(): void {
    this.getCoinSymbols();
  }

  getCoinSymbols(){
    this.coinService.getCoinSymbols().subscribe((res) => {
      Object.keys(res).forEach(key => {
          console.log(res[key].symbol);
          this.coinSymbols.push((res[key].symbol));
    });

     
    })
  }

  onSubmit() {
    if (this.coinService.form.valid) {
      this.coinService.addNewCoin(this.coinService.form.value);
      this.coinService.form.reset();
      this.coinService.initializeFormGroup();
      this.onClose();
    }
  }

  onClear() {
    this.coinService.form.reset();
  }

  onClose() {
    this.coinService.form.reset();
    this.coinService.initializeFormGroup();
    this.dialogRef.close();
  }
}
