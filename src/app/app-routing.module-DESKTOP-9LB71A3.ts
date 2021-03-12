import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CoinListComponent } from './coins/coin-list/coin-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { EditCoinComponent } from './coins/edit-coin/edit-coin.component';
import { LoginComponent } from './user/login/login.component';
import { AuthGuard } from './authentication/auth.guard';

const appRoutes: Routes = [

  { path: 'coin-list', component: CoinListComponent
  ,canActivate:[AuthGuard] 
},
  { path: 'edit-coin', component: EditCoinComponent
   ,canActivate:[AuthGuard] 
},
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
