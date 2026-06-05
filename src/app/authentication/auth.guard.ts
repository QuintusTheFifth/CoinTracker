import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { take, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree>
  {
    // Allow demo mode only after the user explicitly selects demo/wallet demo.
    if (localStorage.getItem('demoMode') === '1') {
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
        return this.router.createUrlTree(['/login'], {
          queryParams: state && state.url ? { returnUrl: state.url } : undefined
        });
      })
    );
  }
}
