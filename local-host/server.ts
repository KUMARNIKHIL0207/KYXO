import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { LOCAL_SIGNALING_HOST, LOCAL_SIGNALING_PORT, LOCAL_HOST_PATH, LOCAL_HOST_PROTOCOL, SIGNALING_MESSAGE_LIMIT } from './config';
import { createSession, LocalSession, validateSession } from './sessions';
import { createMessage, enforceMessageLimits, isValidMessageShape, SignalingMessage } from './signaling';

const sessions = new Map<string, LocalSession>();
const peers = new Map<string, WebSocket>();

const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('KYXO local signaling host');
});

const wss = new WebSocketServer({
  server: httpServer,
  path: LOCAL_HOST_PATH,
});

const getSession = (sessionId: string): LocalSession | undefined => sessions.get(sessionId);

const notifyPeer = (sessionId: string, senderId: string, payload: SignalingMessage) => {
  const session = getSession(sessionId);
  if (!session || !validateSession(session)) {
    return;
  }

  const receiverId = session.initiator === senderId ? session.peer : session.initiator;
  if (!receiverId) {
    return;
  }

  const remoteSocket = peers.get(receiverId);
  if (remoteSocket && remoteSocket.readyState === WebSocket.OPEN) {
    remoteSocket.send(JSON.stringify({ ...payload, receiverId }));
  }
};

wss.on('connection', (socket: WebSocket) => {
  socket.on('message', (raw: unknown) => {
    try {
      enforceMessageLimits(String(raw));
      const parsed = JSON.parse(String(raw)) as unknown;
      if (!isValidMessageShape(parsed)) {
        throw new Error('Malformed signaling message');
      }

      const message = parsed as SignalingMessage;
      const session = getSession(message.sessionId);
      if (!session || !validateSession(session)) {
        throw new Error('Unknown or expired session');
      }

      if (message.token !== session.token) {
        throw new Error('Invalid token');
      }

      peers.set(message.senderId, socket);

      switch (message.type) {
        case 'join': {
          session.state = 'signaling';
          if (!session.initiator) {
            session.initiator = message.senderId;
          } else if (!session.peer) {
            session.peer = message.senderId;
          }
          socket.send(JSON.stringify(createMessage({
            type: 'hello',
            sessionId: session.sessionId,
            token: session.token,
            senderId: 'host',
            receiverId: message.senderId,
            payload: { status: 'joined' },
          })));
          break;
        }
        case 'offer':
        case 'answer':
        case 'candidate':
        case 'ready':
          notifyPeer(message.sessionId, message.senderId, message);
          break;
        case 'leave': {
          session.state = 'closed';
          sessions.delete(session.sessionId);
          peers.delete(message.senderId);
          break;
        }
        default:
          throw new Error('Unsupported message type');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signal validation failed';
      socket.send(JSON.stringify({ type: 'error', reason: message }));
    }
  });

  socket.on('close', () => {
    for (const [peerId, peerSocket] of peers.entries()) {
      if (peerSocket === socket) {
        peers.delete(peerId);
      }
    }
  });
});

const setupSession = (sessionId?: string) => {
  const session = createSession();
  sessions.set(session.sessionId, session);
  return session;
};

// Expose a lightweight session creation endpoint for the frontend to generate QR payloads.
export function createLocalSession(): LocalSession {
  return setupSession();
}

export function getLocalSignalUrl(session: LocalSession): string {
  return `${LOCAL_HOST_PROTOCOL}://${LOCAL_SIGNALING_HOST}:${LOCAL_SIGNALING_PORT}${LOCAL_HOST_PATH}?sid=${session.sessionId}&token=${session.token}`;
}

httpServer.listen(LOCAL_SIGNALING_PORT, LOCAL_SIGNALING_HOST, () => {
  console.log(`KYXO local signaling host listening on ${LOCAL_SIGNALING_HOST}:${LOCAL_SIGNALING_PORT}${LOCAL_HOST_PATH}`);
});
