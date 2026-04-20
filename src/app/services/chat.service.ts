import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  FieldValue,
  Timestamp,
  addDoc,
  collection,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { distinctUntilChanged, shareReplay, switchMap } from 'rxjs/operators';

import { AuthUser } from '../models/auth-user.model';
import { ChatMessage } from '../models/chat-message.model';
import { Room } from '../models/room.model';
import { FirebaseService } from './firebase.service';

type FirestoreDate = Timestamp | Date | null | undefined;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly firebase = inject(FirebaseService);
  private readonly storageKey = 'latido-room-code';
  private readonly roomCodeState = new BehaviorSubject<string>(localStorage.getItem(this.storageKey) ?? '');
  private readonly roomCode$ = this.roomCodeState.pipe(
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly activeRoom$: Observable<Room | null> = this.roomCode$.pipe(
    switchMap((code) => (code ? this.streamRoom(code) : of(null))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly messages$: Observable<ChatMessage[]> = this.roomCode$.pipe(
    switchMap((code) => (code ? this.streamMessages(code) : of([]))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  get currentRoomCode(): string {
    return this.roomCodeState.value;
  }

  async joinRoom(rawCode: string, user: AuthUser): Promise<string> {
    const code = this.normalizeCode(rawCode);
    const roomRef = doc(this.firebase.firestore, 'rooms', code);

    await runTransaction(this.firebase.firestore, async (transaction) => {
      const snapshot = await transaction.get(roomRef);
      const existing = snapshot.data() as DocumentData | undefined;
      const participantUids = Array.isArray(existing?.['participantUids']) ? existing['participantUids'] : [];
      const participantNames = { ...(existing?.['participantNames'] ?? {}) };

      if (!participantUids.includes(user.uid) && participantUids.length >= 2) {
        throw new Error('Este vínculo ya está completo. Usa otro código privado.');
      }

      participantNames[user.uid] = user.displayName?.trim() || user.email || 'Latido';

      transaction.set(
        roomRef,
        {
          code,
          participantUids: participantUids.includes(user.uid)
            ? participantUids
            : [...participantUids, user.uid],
          participantNames,
          createdAt: existing?.['createdAt'] ?? serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });

    this.setRoomCode(code);
    return code;
  }

  async leaveRoom(user: AuthUser): Promise<void> {
    const roomCode = this.currentRoomCode;
    if (!roomCode) {
      return;
    }

    const roomRef = doc(this.firebase.firestore, 'rooms', roomCode);

    await runTransaction(this.firebase.firestore, async (transaction) => {
      const snapshot = await transaction.get(roomRef);
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.data();
      const participantUids = Array.isArray(data['participantUids']) ? data['participantUids'] : [];
      const nextParticipantUids = participantUids.filter((uid: string) => uid !== user.uid);

      transaction.update(roomRef, {
        participantUids: nextParticipantUids,
        [`participantNames.${user.uid}`]: deleteField(),
        updatedAt: serverTimestamp() as FieldValue
      });
    });

    this.clearRoomCode();
  }

  async sendMessage(text: string, user: AuthUser, kind: 'custom' | 'quick' = 'custom'): Promise<void> {
    const roomCode = this.currentRoomCode;
    if (!roomCode) {
      throw new Error('Primero debes entrar a un vínculo.');
    }

    const content = text.trim();
    if (!content) {
      return;
    }

    const messagesCollection = collection(this.firebase.firestore, 'rooms', roomCode, 'messages');
    await addDoc(messagesCollection, {
      text: content,
      senderId: user.uid,
      senderName: user.displayName?.trim() || user.email || 'Latido',
      kind,
      createdAt: serverTimestamp()
    });

    const roomRef = doc(this.firebase.firestore, 'rooms', roomCode);
    await runTransaction(this.firebase.firestore, async (transaction) => {
      const snapshot = await transaction.get(roomRef);
      if (!snapshot.exists()) {
        throw new Error('La sala ya no está disponible.');
      }

      transaction.update(roomRef, { updatedAt: serverTimestamp() as FieldValue });
    });
  }

  private setRoomCode(code: string): void {
    this.roomCodeState.next(code);
    localStorage.setItem(this.storageKey, code);
  }

  private clearRoomCode(): void {
    this.roomCodeState.next('');
    localStorage.removeItem(this.storageKey);
  }

  private streamRoom(code: string): Observable<Room | null> {
    const roomRef = doc(this.firebase.firestore, 'rooms', code);
    return new Observable<Room | null>((subscriber) =>
      onSnapshot(
        roomRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            subscriber.next(null);
            return;
          }

          const data = snapshot.data();
          subscriber.next({
            id: snapshot.id,
            code: data['code'],
            participantUids: data['participantUids'] ?? [],
            participantNames: data['participantNames'] ?? {},
            createdAt: this.toDate(data['createdAt']),
            updatedAt: this.toDate(data['updatedAt'])
          });
        },
        (error) => subscriber.error(error)
      )
    );
  }

  private streamMessages(code: string): Observable<ChatMessage[]> {
    const messagesRef = collection(this.firebase.firestore, 'rooms', code, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    return new Observable<ChatMessage[]>((subscriber) =>
      onSnapshot(
        messagesQuery,
        (snapshot) => {
          subscriber.next(
            snapshot.docs.map((entry) => {
              const data = entry.data();
              return {
                id: entry.id,
                text: data['text'],
                senderId: data['senderId'],
                senderName: data['senderName'],
                kind: (data['kind'] as 'custom' | 'quick') ?? 'custom',
                createdAt: this.toDate(data['createdAt']) ?? new Date()
              };
            })
          );
        },
        (error) => subscriber.error(error)
      )
    );
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 18);
  }

  private toDate(value: FirestoreDate): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Timestamp) {
      return value.toDate();
    }

    return value instanceof Date ? value : null;
  }
}
