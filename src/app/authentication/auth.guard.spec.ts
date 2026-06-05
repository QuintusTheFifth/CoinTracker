import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  afterEach(() => localStorage.clear());

  it('should be created', () => {
    const guard = new AuthGuard({ user$: of(null) } as any);
    expect(guard).toBeTruthy();
  });

  it('allows demo mode', (done) => {
    localStorage.setItem('demoMode', '1');
    const guard = new AuthGuard({ user$: of(null) } as any);
    guard.canActivate({} as any, {} as any).subscribe((allowed) => {
      expect(allowed).toBe(true);
      done();
    });
  });

  it('enables demo mode and allows the originally requested deep link', (done) => {
    const guard = new AuthGuard({ user$: of(null) } as any);

    guard.canActivate({} as any, { url: '/edit-coin/BTC' } as any).subscribe((allowed) => {
      expect(allowed).toBe(true);
      expect(localStorage.getItem('demoMode')).toBe('1');
      done();
    });
  });
});
