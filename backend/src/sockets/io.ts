import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { isAllowedOrigin } from '../config/env.js';
import { logger } from '../config/logger.js';
import { verifyToken } from '../services/authService.js';

let io: Server | null = null;

export function getIo() {
  return io;
}

export function attachSockets(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token ?? socket.handshake.query.token ?? '');
      if (!token) return next(new Error('AUTH_REQUIRED'));
      const account = verifyToken(token);
      socket.data.account = account;
      next();
    } catch {
      next(new Error('AUTH_REQUIRED'));
    }
  });

  io.on('connection', (socket) => {
    const account = socket.data.account;
    const room = `${String(account.role).toLowerCase()}:${account.id}`;
    void socket.join(room);
    if (account.role === 'ADMIN') void socket.join('admin:ops');
    if (account.propertyId) void socket.join(`property:${account.propertyId}`);
    logger.debug({ room, id: account.id }, 'socket joined');
  });

  return io;
}

export function emitStatus(room: string, event: string, payload: unknown) {
  io?.to(room).emit(event, payload);
}
