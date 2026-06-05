import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';

import { map, switchMap } from 'rxjs/operators';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;

  uid;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private ngZone: NgZone
  ) {
    //geeft je de userrecord tab in de authenticatie tab
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          this.uid = user.uid;
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges().pipe(
            map(profile => profile || {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            })
          );
        }
        this.uid = null;
        return of(null);
      })
    );
  }

  async googleSignin(redirectUrl: string = 'coin-list') {
    const provider = new auth.GoogleAuthProvider();
    const credential = await this.afAuth.auth.signInWithPopup(provider);
    localStorage.removeItem('demoMode');
    localStorage.removeItem('walletDemoAddress');
    return this.updateUserData(credential.user, redirectUrl);
  }

  /** Connect with MetaMask / Ethereum wallet */
  async walletLogin(redirectUrl: string = 'coin-list'): Promise<void> {
    const eth = (window as any).ethereum;
    // Check if MetaMask is installed
    if (!eth || !eth.request) {
      throw new Error(
        'MetaMask is not installed. Please install MetaMask browser extension to login with your wallet.'
      );
    }

    // Request MetaMask accounts
    const accounts = (await eth.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in MetaMask. Please unlock MetaMask.');
    }

    const account = accounts[0];

    // Sign a message to prove ownership
    const message = 'Sign in to CoinTracker: ' + Date.now();
    const signature = (await eth.request({
      method: 'personal_sign',
      params: [message, account],
    })) as string;

    // Use the Ethereum address as the user UID
    const uid = account.toLowerCase();

    // Wallet sessions are local demo sessions unless a backend custom-token
    // exchange is added. Owner-scoped Firestore rules intentionally require
    // Firebase Auth, so this path proves wallet ownership and then uses the
    // local demo portfolio instead of attempting unauthorized Firestore writes.
    this.enableWalletDemoSession(uid);

    this.ngZone.run(() => {
      this.router.navigateByUrl(redirectUrl || 'coin-list');
    });
  }

  private enableWalletDemoSession(uid: string): void {
    this.uid = null;
    localStorage.setItem('walletDemoAddress', uid);
    localStorage.setItem('demoMode', '1');
  }

  getUID() {
    return this.uid;
  }

  async signOut() {
    localStorage.removeItem('demoMode');
    localStorage.removeItem('walletDemoAddress');
    this.uid = null;
    await this.afAuth.auth.signOut();
    this.ngZone.run(() => {
      this.router.navigate(['login']);
    });
  }

  private async updateUserData(user, redirectUrl: string = 'coin-list') {
    // Sets user data to firestore on login, add custom code here
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`
    );

    const data = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    this.uid = data.uid;
    //

    //change only the properties that changed
    await userRef.set(data, { merge: true });

    this.ngZone.run(() => {
      this.router.navigateByUrl(redirectUrl || 'coin-list');
    });
  }
}
