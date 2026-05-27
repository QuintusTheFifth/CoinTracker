import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
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
    // Allow demo mode without authentication
    if (localStorage.getItem('demoMode')) {
      return new Observable<boolean>(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    return this.auth.user$.pipe(
      take(1),
      map(user => !!user),
      tap(loggedIn => {
        if (!loggedIn) {
          // Auto-enable demo mode as fallback when no user is authenticated
          localStorage.setItem('demoMode', '1');
          this.ngZone.run(() => {
            this.router.navigate(['coin-list']);
          });
        }
      })
    );
  }
}
