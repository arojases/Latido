export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  kind: 'custom' | 'quick';
  createdAt: Date;
}
