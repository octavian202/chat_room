export type MessageType = 'TEXT' | 'JOINED' | 'LEFT';

export interface ChatMessage {
  id?: number;
  sender: string;
  content: string;
  timestamp?: string;
  messageType: MessageType;
  roomId: string;
}