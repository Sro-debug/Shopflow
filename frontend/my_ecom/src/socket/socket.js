import { io } from 'socket.io-client';
import config from '../config/config';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(config.WS_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

export default { connectSocket, disconnectSocket, getSocket };
