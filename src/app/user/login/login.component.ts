import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/authentication/auth.service';
import { CoinsService } from 'src/app/coins/services/coin.data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public user: FormGroup;
  public errorMessage: string = '';
  public walletLoggingIn: boolean = false;

  constructor(
   public auth: AuthService,
   private coinService: CoinsService,
   private router: Router
  ) {}

  ngOnInit() {
  }

  /** Explicitly enter demo mode (seeded sample portfolio, no account). */
  onDemo() {
    this.coinService.enableDemoMode();
    this.router.navigate(['coin-list']);
  }

  async onWalletLogin() {
    this.walletLoggingIn = true;
    this.errorMessage = '';
    try {
      await this.auth.walletLogin();
    } catch (err) {
      this.errorMessage = err.message || 'Failed to connect wallet.';
      console.error('Wallet login error:', err);
    } finally {
      this.walletLoggingIn = false;
    }
  }

  async onGoogleLogin() {
    try {
      await this.auth.googleSignin();
    } catch (err) {
      this.errorMessage = err.message || 'Google sign-in failed.';
    }
  }
}
