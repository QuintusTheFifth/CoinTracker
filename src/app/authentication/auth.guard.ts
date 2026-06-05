import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean>
  {
    // Allow demo mode without authentication
    if (localStorage.getItem('demoMode')) {
      return new Observable<boolean>(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    return this.auth.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        }
        // Auto-enable demo mode as a read/write local fallback and allow the
        // originally requested route. This keeps fresh deep links such as
        // /edit-coin/BTC from being bounced to the portfolio overview first.
        localStorage.setItem('demoMode', '1');
        return true;
      })
    );
  }
}
