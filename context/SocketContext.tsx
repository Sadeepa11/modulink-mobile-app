// ============================================================
// Socket Context — manages the Socket.IO connection + logging
// ============================================================

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/services/api';
import Logger from '@/utils/logger';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      if (socketRef.current) {
        Logger.socket('disconnect — user logged out');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    Logger.socket('connecting', { url: API_BASE_URL, userId: user.id });

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      Logger.socket('connected', { socketId: socket.id, userId: user.id });
      setIsConnected(true);
      socket.emit('user_connected', user.id);
    });

    socket.on('disconnect', (reason) => {
      Logger.socket('disconnected', { reason });
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      Logger.error('Socket.IO connection error', err);
    });

    socket.on('reconnect_attempt', (attempt) => {
      Logger.socket('reconnect attempt', { attempt });
    });

    socket.on('reconnect', (attempt) => {
      Logger.socket('reconnected', { attempt });
    });

    socket.on('reconnect_failed', () => {
      Logger.error('Socket.IO gave up reconnecting after 5 attempts');
    });

    // Log every inbound event for debugging
    socket.onAny((event, ...args) => {
      Logger.socket(`← ${event}`, args.length === 1 ? args[0] : args);
    });

    // Log every outbound emit for debugging
    const origEmit = socket.emit.bind(socket);
    (socket as any).emit = (event: string, ...args: any[]) => {
      Logger.socket(`→ ${event}`, args.length === 1 ? args[0] : args);
      return origEmit(event, ...args);
    };

    return () => {
      Logger.socket('cleanup — disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
