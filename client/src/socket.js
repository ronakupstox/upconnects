import { io } from 'socket.io-client';

// Same origin when frontend + backend are on Render together.
// Set VITE_SOCKET_URL to your Render backend URL when deploying frontend to Vercel.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
