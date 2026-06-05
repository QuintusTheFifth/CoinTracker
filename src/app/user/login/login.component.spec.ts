import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let demoEnabled: boolean;
  let navigatedUrl: string;

  const coinService = {
    enableDemoMode: () => {
      demoEnabled = true;
    }
  } as any;
  const router = {
    navigate: () => Promise.resolve(true),
    navigateByUrl: (url: string) => {
      navigatedUrl = url;
      return Promise.resolve(true);
    }
  } as any;
  const createRoute = (returnUrl: string | null = null) => ({
    snapshot: {
      queryParamMap: {
        get: (key: string) => key === 'returnUrl' ? returnUrl : null
      }
    }
  }) as any;
  const createComponent = (auth: any, returnUrl: string | null = null) =>
    new LoginComponent(auth, coinService, router, createRoute(returnUrl));

  beforeEach(() => {
    demoEnabled = false;
    navigatedUrl = '';
  });

  it('should create', () => {
    const auth = { googleSignin: () => Promise.resolve(), walletLogin: () => Promise.resolve() } as any;
    const component = createComponent(auth);
    expect(component).toBeTruthy();
  });

  it('resets wallet loading after login', async () => {
    let walletRedirect = '';
    const auth = {
      googleSignin: () => Promise.resolve(),
      walletLogin: (redirectUrl: string) => {
        walletRedirect = redirectUrl;
        return Promise.resolve();
      }
    } as any;
    const component = createComponent(auth, '/edit-coin/BTC');
    await component.onWalletLogin();
    expect(component.walletLoggingIn).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(walletRedirect).toBe('/edit-coin/BTC');
  });

  it('passes the return URL to Google sign-in', async () => {
    let googleRedirect = '';
    const auth = {
      googleSignin: (redirectUrl: string) => {
        googleRedirect = redirectUrl;
        return Promise.resolve();
      },
      walletLogin: () => Promise.resolve()
    } as any;
    const component = createComponent(auth, '/coin-list');

    await component.onGoogleLogin();

    expect(googleRedirect).toBe('/coin-list');
  });

  it('enters demo mode explicitly and redirects to the preserved return URL', () => {
    const auth = { googleSignin: () => Promise.resolve(), walletLogin: () => Promise.resolve() } as any;
    const component = createComponent(auth, '/edit-coin/ETH');

    component.onDemo();

    expect(demoEnabled).toBe(true);
    expect(navigatedUrl).toBe('/edit-coin/ETH');
  });

  it('shows a friendly Google sign-in error instead of raw Firebase text', async () => {
    const auth = {
      googleSignin: () => Promise.reject(new Error('auth/unauthorized-domain: This domain is not authorized')),
      walletLogin: () => Promise.resolve()
    } as any;
    const component = createComponent(auth);

    await component.onGoogleLogin();

    expect(component.errorMessage).toBe('Google sign-in is not available in this environment. You can continue in demo mode or use a configured production domain.');
  });

  it('shows a friendly wallet error when MetaMask is unavailable', async () => {
    const auth = {
      googleSignin: () => Promise.resolve(),
      walletLogin: () => Promise.reject(new Error('MetaMask is not installed. Please install MetaMask browser extension to login with your wallet.'))
    } as any;
    const component = createComponent(auth);

    await component.onWalletLogin();

    expect(component.errorMessage).toBe('MetaMask is not available in this browser. You can still explore CoinTracker in demo mode.');
  });
});
