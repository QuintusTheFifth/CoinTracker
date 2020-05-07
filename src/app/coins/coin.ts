/*Defines the coin entity */
export interface ICoin {
  id: number;
  coinName: string;
  price: number;
  amount: number;
  exchange: string;
  date: Date;
}

export class Coin implements ICoin {
  id: number;
  coinName: string;
  price: number;
  amount: number;
  exchange: string;
  date: Date;
  get total(){
    return this.price*this.amount
  }
  constructor() {
   }
   
}
