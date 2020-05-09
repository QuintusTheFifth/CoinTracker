/*Defines the coin entity */
export interface CoinJson {
  id:number;
  name: string;
  amount: number;
  priceBought:number;
  exchange:string;
  date:string;
  customerId:number;
}

export class Coin{

  private _id:number;
  private _customerId: number;
  public currentPrice:number;

  constructor(public _name: string,
     public _amount: number,
     public _priceBought:number,
     public _dateBought:Date,
     public _exchange:string) {
   }

  static fromJSON(json: CoinJson): Coin{

    const coin = new Coin(
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
     amount:this.amount,
     priceBought:this.priceBought,
     exchange:this.exchange,
     date:this.dateBought.toString(),
     customerId:this.customerId
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

  get customerId():number{
    return this._customerId;
  }

  get price():number{
    return this.currentPrice;
  }

  

  
   
}
