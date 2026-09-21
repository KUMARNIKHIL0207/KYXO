import { randomUUID } from 'node:crypto';
import { SIGNALING_MESSAGE_LIMIT } from './config';

export type SignalingMessageType =
  | 'hello'
  | 'offer'
  | 'answer'
  | 'candidate'
  | 'join'
  | 'leave'
  | 'ready'
  | 'error';

export interface SignalingMessage {
  type: SignalingMessageType;
  sessionId: string;
  token: string;
  senderId: string;
  receiverId?: string;
  payload?: unknown;
  createdAt: number;
}

export function isValidMessageShape(value: unknown): value is SignalingMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.type === 'string' &&
    typeof candidate.sessionId === 'string' &&
    typeof candidate.token === 'string' &&
    typeof candidate.senderId === 'string' &&
    typeof candidate.createdAt === 'number'
  );
}

export function createMessage(message: Omit<SignalingMessage, 'createdAt'>): SignalingMessage {
  return {
    ...message,
    createdAt: Date.now(),
  };
}

export function rejectMessage(reason: string): { type: 'error'; reason: string; id: string } {
  return { type: 'error', reason, id: randomUUID() };
}

export function enforceMessageLimits(raw: string): void {
  if (raw.length > SIGNALING_MESSAGE_LIMIT) {
    throw new Error('Message too large');
  }
}
