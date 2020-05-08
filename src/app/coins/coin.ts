/*Defines the coin entity */
export interface ICoin {
  coinName: string;
  price: number;
  amount: number;
  exchange: string;
  date: Date;
}

export class Coin implements ICoin {
  coinName: string;
  price: number;
  amount: number;
  exchange: string;
  date: Date;
  get total():number{
    return this.price*this.amount
  }
  constructor(coinName: string,
    price: number,
    amount: number) {
      this.coinName=coinName;
      this.price=price;
      this.amount=amount;
   }
   
}
