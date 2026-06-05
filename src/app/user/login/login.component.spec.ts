import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const coinService = { enableDemoMode: () => undefined } as any;
  const router = { navigate: () => Promise.resolve(true) } as any;
  const createComponent = (auth: any) => new LoginComponent(auth, coinService, router);

  it('should create', () => {
    const auth = { googleSignin: () => Promise.resolve(), walletLogin: () => Promise.resolve() } as any;
    const component = createComponent(auth);
    expect(component).toBeTruthy();
  });

  it('resets wallet loading after login', async () => {
    const auth = { googleSignin: () => Promise.resolve(), walletLogin: () => Promise.resolve() } as any;
    const component = createComponent(auth);
    await component.onWalletLogin();
    expect(component.walletLoggingIn).toBe(false);
    expect(component.errorMessage).toBe('');
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
