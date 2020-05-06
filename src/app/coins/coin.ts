/*Defines the coin entity */
export interface ICoin {
  id: number;
  coinName: string;
  price: number;
  amount: number;
  exchange: string;
  date: Date;
  total: number;
}

export class Coin implements ICoin {

  constructor(
    public id: number,
    public coinName: string,
    public price: number,
    public amount: number,
    public exchange: string,
    public date: Date,
    public total: number
  ) {
   }
}
