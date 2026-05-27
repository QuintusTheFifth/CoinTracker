import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';

import { switchMap } from 'rxjs/operators';
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
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          // Check for wallet-based user (stored in localStorage)
          const walletUid = localStorage.getItem('walletUid');
          if (walletUid) {
            return this.afs.doc<User>(`users/${walletUid}`).valueChanges();
          }
          return of(null);
        }
      })
    );

    // Restore wallet session on init
    const savedWallet = localStorage.getItem('walletUid');
    if (savedWallet) {
      this.uid = savedWallet;
    }
  }

  async googleSignin() {
    const provider = new auth.GoogleAuthProvider();
    const credential = await this.afAuth.auth.signInWithPopup(provider);
    return this.updateUserData(credential.user);
  }

  /** Connect with MetaMask / Ethereum wallet */
  async walletLogin(): Promise<void> {
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
    this.uid = uid;

    // Leaving demo mode now that the user is signing in for real
    localStorage.removeItem('demoMode');

    // Persist wallet session
    localStorage.setItem('walletUid', uid);

    // Store user data in Firestore under /users/{address}/
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${uid}`
    );

    const displayName =
      'Wallet ' + uid.substring(0, 6) + '...' + uid.substring(38);

    const data = {
      uid: uid,
      email: '',
      displayName: displayName,
      photoURL: '',
      walletAddress: uid,
    };

    await userRef.set(data, { merge: true });

    // Navigate to coin-list inside Angular zone
    this.ngZone.run(() => {
      this.router.navigateByUrl('coin-list');
    });
  }

  getUID() {
    return this.uid;
  }

  async signOut() {
    localStorage.removeItem('walletUid');
    localStorage.removeItem('demoMode');
    await this.afAuth.auth.signOut();
    this.ngZone.run(() => {
      this.router.navigate(['login']);
    });
  }

  private updateUserData(user) {
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

    // Leaving demo mode now that the user is signed in for real
    localStorage.removeItem('demoMode');
    //

    this.ngZone.run(() => {
      this.router.navigateByUrl('coin-list');
    });

    //change only the properties that changed
    return userRef.set(data, { merge: true });
  }
}
