import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './user/auth.guard';
import { CoinListComponent } from './coins/coin-list/coin-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { EditCoinComponent } from './coins/edit-coin/edit-coin.component';
import { RegisterComponent } from './user/register/register.component';
import { LoginComponent } from './user/login/login.component';

const appRoutes: Routes = [
  { path: 'coin-list', canActivate: [AuthGuard], component: CoinListComponent },
  { path: '', redirectTo: 'coin-list', pathMatch: 'full' },
  { path: 'edit-coin', component: EditCoinComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },

  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
