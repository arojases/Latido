export interface Room {
  id: string;
  code: string;
  participantUids: string[];
  participantNames: Record<string, string>;
  createdAt: Date | null;
  updatedAt: Date | null;
}
