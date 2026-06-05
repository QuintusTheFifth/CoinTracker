import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const makeRouter = () => ({
    createUrlTree: (commands: any[], extras?: any) => ({ commands, extras })
  } as any);

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    const guard = new AuthGuard({ user$: of(null) } as any, makeRouter());
    expect(guard).toBeTruthy();
  });

  it('allows explicit demo mode', (done) => {
    localStorage.setItem('demoMode', '1');
    const guard = new AuthGuard({ user$: of(null) } as any, makeRouter());
    guard.canActivate({} as any, {} as any).subscribe((allowed) => {
      expect(allowed).toBe(true);
      done();
    });
  });

  it('does not allow malformed demo mode values', (done) => {
    localStorage.setItem('demoMode', '0');
    const guard = new AuthGuard({ user$: of(null) } as any, makeRouter());

    guard.canActivate({} as any, { url: '/coin-list' } as any).subscribe((result: any) => {
      expect(result.commands).toEqual(['/login']);
      expect(result.extras.queryParams.returnUrl).toBe('/coin-list');
      done();
    });
  });

  it('redirects unauthenticated deep links without silently enabling demo mode', (done) => {
    const guard = new AuthGuard({ user$: of(null) } as any, makeRouter());

    guard.canActivate({} as any, { url: '/edit-coin/BTC' } as any).subscribe((result: any) => {
      expect(result.commands).toEqual(['/login']);
      expect(result.extras.queryParams.returnUrl).toBe('/edit-coin/BTC');
      expect(localStorage.getItem('demoMode')).toBeNull();
      done();
    });
  });
});
