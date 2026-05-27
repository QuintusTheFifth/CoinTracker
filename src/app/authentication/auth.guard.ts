import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { take, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router, private ngZone: NgZone) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean>
  {
    // Explicit demo mode — only set when the user chooses "Try the demo".
    if (localStorage.getItem('demoMode') === '1') {
      return of(true);
    }
    // Wallet session (MetaMask) is authenticated even if Firestore is slow/offline.
    if (localStorage.getItem('walletUid')) {
      return of(true);
    }
    // Otherwise require a signed-in user; if none, send them to /login.
    return this.auth.user$.pipe(
      take(1),
      map(user => !!user),
      tap(loggedIn => {
        if (!loggedIn) {
          this.ngZone.run(() => {
            this.router.navigate(['login']);
          });
        }
      })
    );
  }
}
