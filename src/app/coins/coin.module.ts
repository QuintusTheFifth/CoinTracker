import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddCoinComponent } from './add-coin.component';
import { RouterModule } from '@angular/router';
import { materialize } from 'rxjs/operators';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { MatFormField } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    AddCoinComponent
  ],
  imports: [
    RouterModule.forChild([
      {path:"coin-add",component:AddCoinComponent}
    ]),
    FormsModule
  ],
  entryComponents:[AddCoinComponent]
})
export class CoinModule { }
