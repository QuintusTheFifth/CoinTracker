import { AuthenticationService } from '../user/authentication.service';

/*Defines the coin entity */
export interface CoinJson {
  id:number;
  name: string;
  amount: number;
  priceBought:number;
  exchange:string;
  date:string;
}

export class Coin{

  public currentPrice:number;
  private auth: AuthenticationService;

  constructor(
    public _id:number,
    public _name: string,
     public _amount: number,
     public _priceBought:number,
     public _dateBought= new Date(),
     public _exchange:string,
    ) {
   }

  static fromJSON(json: CoinJson): Coin{
    const coin = new Coin(
      json.id,
      json.name,
      json.amount,
      json.priceBought,
      new Date(json.date),
      json.exchange,
    );
      coin._id=json.id;
    return coin;
  }

  toJSON(): CoinJson {
    return <CoinJson>{
     name:this.name,
     priceBought:this.priceBought,
     amount:this.amount,
     date:this.dateBought.toString(),
     exchange:this.exchange,
    };
  }

  get id(): number{
    return this._id;
  }

  get name():string{
    return this._name;
  }

  get amount():number{
    return this._amount;
  }

  get priceBought():number{
    return this._priceBought;
  }

  get exchange():string{
    return this._exchange;
  }

  get dateBought():Date{
    return this._dateBought;
  }

  get price():number{
    return this.currentPrice;
  }

  

  
   
}
