import { Injectable, inject } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { AuthUser } from '../models/auth-user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly firebase = inject(FirebaseService);

  readonly authUser$: Observable<AuthUser | null> = new Observable<User | null>((subscriber) =>
    onAuthStateChanged(
      this.firebase.auth,
      (user) => subscriber.next(user),
      (error) => subscriber.error(error),
      () => subscriber.complete()
    )
  ).pipe(
    map((user) =>
      user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isAnonymous: user.isAnonymous
          }
        : null
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  async loginAnonymously(nickname: string): Promise<void> {
    const credential = await signInAnonymously(this.firebase.auth);
    const safeName = nickname.trim() || 'Latido anónimo';
    await updateProfile(credential.user, { displayName: safeName });
  }

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.firebase.auth, email, password);
  }

  async registerWithEmail(email: string, password: string, nickname: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(this.firebase.auth, email, password);
    if (nickname.trim()) {
      await updateProfile(credential.user, { displayName: nickname.trim() });
    }
  }

  async logout(): Promise<void> {
    await signOut(this.firebase.auth);
  }
}
