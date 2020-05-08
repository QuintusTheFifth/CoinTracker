import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ICoin, Coin } from '../coin';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import{MatDialogRef} from '@angular/material/dialog';

import { EMPTY } from 'rxjs';
import { CoinsService } from '../services/coins.service';

@Component({
  selector:"app-add-coin",
  templateUrl: './add-coin.component.html',
  styleUrls: ['./add-coin.component.css'],

})
export class AddCoinComponent implements OnInit {
  @Output() public newCoin = new EventEmitter<Coin>();
  coinSubmit:Coin;

  PageTitle:string="Add a holding";
  public coin:FormGroup
  
  constructor(public service: CoinsService,
    public dialogRef: MatDialogRef<AddCoinComponent>,
  ) { }

  _listFilter = '';
  get listFilter(): string {
    return this._listFilter;
  }

  set listFilter(value: string) {
    this._listFilter = value;
    this.filteredCoins = this.listFilter
      ? this.performFilter(this.listFilter)
      : this.coins;
  }

  filteredCoins: ICoin[];
  coins: Coin[]

  performFilter(filterBy: string): ICoin[] {
    filterBy = filterBy.toLocaleLowerCase();
    return this.coins.filter(
      (coin: ICoin) =>
        coin.coinName.toLocaleLowerCase().indexOf(filterBy) !== -1
    );
  }

  ngOnInit(): void {
this.service.getCoinsCustomer();
  }

  onSubmit(){
    if(this.service.form.valid){
      this.service.addNewCoin(this.service.form.value);
      this.service.form.reset();
      this.service.initializeFormGroup();
      this.onClose();
    }
  }

  onClear() {
    this.service.form.reset();
  }

  onClose(){
    this.service.form.reset();
    this.service.initializeFormGroup();
    this.dialogRef.close();
  }

}
