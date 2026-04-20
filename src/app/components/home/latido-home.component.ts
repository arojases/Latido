import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthUser } from '../../models/auth-user.model';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { AuthPanelComponent } from '../auth-panel/auth-panel.component';
import { FloatingHeartsComponent } from '../floating-hearts/floating-hearts.component';
import { MessageComposerComponent } from '../message-composer/message-composer.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { NotificationBannerComponent } from '../notification-banner/notification-banner.component';
import { RoomSetupComponent } from '../room-setup/room-setup.component';

@Component({
  selector: 'app-latido-home',
  standalone: true,
  imports: [
    CommonModule,
    AuthPanelComponent,
    FloatingHeartsComponent,
    MessageComposerComponent,
    MessageListComponent,
    NotificationBannerComponent,
    RoomSetupComponent
  ],
  templateUrl: './latido-home.component.html',
  styleUrl: './latido-home.component.scss'
})
export class LatidoHomeComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private notificationTimer: number | null = null;

  protected readonly authUser$ = this.authService.authUser$;
  protected readonly room$ = this.chatService.activeRoom$;
  protected readonly messages$ = this.chatService.messages$;
  protected readonly roomBusy = signal(false);
  protected readonly roomError = signal('');
  protected readonly notification = signal('');
  protected readonly heartTrigger = signal(0);
  protected readonly heroStats = ['Tiempo real', 'Solo dos personas', 'Hosting listo'];

  protected readonly partnerName$ = combineLatest([this.room$, this.authUser$]).pipe(
    map(([room, user]) => {
      if (!room || !user) {
        return 'tu persona favorita';
      }

      const partner = Object.entries(room.participantNames).find(([uid]) => uid !== user.uid);
      return partner?.[1] ?? 'tu persona favorita';
    })
  );

  constructor() {
    this.title.setTitle('Latido');
    this.meta.updateTag({
      name: 'description',
      content: 'Latido te permite enviar detalles y mensajes intimos en tiempo real.'
    });

    combineLatest([this.messages$, this.authUser$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([messages, user]) => {
        if (!messages.length || !user) {
          return;
        }

        const latest = messages[messages.length - 1];
        if (latest.senderId === user.uid) {
          return;
        }

        this.notification.set(`${latest.senderName} te dijo: ${latest.text}`);
        this.heartTrigger.update((value) => value + 1);

        if (this.notificationTimer) {
          window.clearTimeout(this.notificationTimer);
        }

        this.notificationTimer = window.setTimeout(() => this.notification.set(''), 3200);
      });

    this.destroyRef.onDestroy(() => {
      if (this.notificationTimer) {
        window.clearTimeout(this.notificationTimer);
      }
    });
  }

  protected async joinRoom(code: string, user: AuthUser | null): Promise<void> {
    if (!user) {
      this.roomError.set('Primero necesitas iniciar sesion.');
      return;
    }

    this.roomBusy.set(true);
    this.roomError.set('');

    try {
      await this.chatService.joinRoom(code, user);
    } catch (error) {
      this.roomError.set(error instanceof Error ? error.message : 'No fue posible entrar al vinculo.');
    } finally {
      this.roomBusy.set(false);
    }
  }

  protected async sendMessage(
    text: string,
    user: AuthUser | null,
    kind: 'custom' | 'quick' = 'custom'
  ): Promise<void> {
    if (!user) {
      return;
    }

    await this.chatService.sendMessage(text, user, kind);
  }

  protected async leaveRoom(user: AuthUser | null): Promise<void> {
    if (!user) {
      return;
    }

    await this.chatService.leaveRoom(user);
  }

  protected async logout(user: AuthUser | null): Promise<void> {
    await this.leaveRoom(user);
    await this.authService.logout();
  }
}
