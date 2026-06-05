import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/authentication/auth.service';
import { CoinsService } from 'src/app/coins/services/coin.data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
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
      this.errorMessage = this.friendlyAuthError(err, 'wallet');
    } finally {
      this.walletLoggingIn = false;
    }
  }

  async onGoogleLogin() {
    this.errorMessage = '';
    try {
      await this.auth.googleSignin();
    } catch (err) {
      this.errorMessage = this.friendlyAuthError(err, 'google');
    }
  }

  private friendlyAuthError(err: any, provider: 'google' | 'wallet'): string {
    const message = String(err && err.message ? err.message : err || '').toLowerCase();

    if (provider === 'google' && (message.includes('unauthorized-domain') || message.includes('domain'))) {
      return 'Google sign-in is not available in this environment. You can continue in demo mode or use a configured production domain.';
    }

    if (provider === 'wallet' && (message.includes('metamask') || message.includes('ethereum'))) {
      return 'MetaMask is not available in this browser. You can still explore CoinTracker in demo mode.';
    }

    return provider === 'google'
      ? 'Google sign-in failed. Please try again or continue in demo mode.'
      : 'Wallet connection failed. Please try again or continue in demo mode.';
  }
}
