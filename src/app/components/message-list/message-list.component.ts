import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

import { ChatMessage } from '../../models/chat-message.model';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
  animations: [
    trigger('messageIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.94) translateY(10px)' }),
        animate('260ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ])
  ]
})
export class MessageListComponent {
  @Input({ required: true }) messages: ChatMessage[] = [];
  @Input({ required: true }) currentUserId = '';

  protected isMine(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }
}
