// ============================================================
// Authentication Context
// Makes the logged-in user available to every screen in the app
// without having to pass it down through props manually.
//
// React Context is like a "global variable" for React components.
// Any component can call useAuth() to get the current user.
//
// Usage in any component:
//   const { user, login, logout, isLoading } = useAuth();
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

import api from '@/services/api';
import Logger from '@/utils/logger';

// -------------------------------------------------------
// Type Definitions
// TypeScript interfaces describe the shape of our data
// -------------------------------------------------------
interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;           // The logged-in user (null if not logged in)
  token: string | null;        // The JWT token
  isLoading: boolean;          // True while checking stored credentials on startup
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void; // Update user in context after profile edit
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  name?: string;
}

// -------------------------------------------------------
// Create the context with a default value of undefined
// The undefined check in useAuth() prevents using the hook
// outside of the AuthProvider
// -------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// -------------------------------------------------------
// AuthProvider Component
// Wrap the entire app in this so all screens can access auth state
// -------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true — checking storage

  // -------------------------------------------------------
  // On app startup: check if the user was previously logged in
  // AsyncStorage persists data between app sessions (like localStorage on web)
  // -------------------------------------------------------
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          Logger.auth('Restored session from storage', { userId: parsedUser?.id, username: parsedUser?.username });
        } else {
          Logger.auth('No stored session — showing login');
        }
      } catch (error) {
        Logger.error('Failed to load stored auth', error);
      } finally {
        // Always set isLoading to false when done, even if it failed
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // -------------------------------------------------------
  // login: Send credentials to the server, store the token
  // -------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    Logger.auth('Login attempt', { email });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = response.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      Logger.auth('Login successful', { userId: newUser.id, username: newUser.username });
    } catch (error: any) {
      const msg = error.response?.data?.error
        || (error.code === 'ECONNREFUSED' || error.message?.includes('Network')
            ? 'Cannot reach server. Check your WiFi and the API URL in services/api.ts.'
            : error.message || 'Login failed.');
      Logger.error('Login failed', { email, reason: msg });
      throw new Error(msg);
    }
  }, []);

  // -------------------------------------------------------
  // register: Create a new account and immediately log in
  // -------------------------------------------------------
  const register = useCallback(async (data: RegisterData) => {
    Logger.auth('Register attempt', { email: data.email, username: data.username });
    try {
      const response = await api.post('/auth/register', data);
      const { token: newToken, user: newUser } = response.data;
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      Logger.auth('Register successful', { userId: newUser.id, username: newUser.username });
    } catch (error: any) {
      const msg = error.response?.data?.error
        || (error.code === 'ECONNREFUSED' || error.message?.includes('Network')
            ? 'Cannot reach server. Check your WiFi and the API URL in services/api.ts.'
            : error.message || 'Registration failed.');
      Logger.error('Register failed', { username: data.username, reason: msg });
      throw new Error(msg);
    }
  }, []);

  // -------------------------------------------------------
  // logout: Clear stored credentials and return to login screen
  // -------------------------------------------------------
  const logout = useCallback(async () => {
    Logger.auth('User logged out');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    // Setting user/token to null triggers the _layout.tsx to redirect to login
    setToken(null);
    setUser(null);
  }, []);

  // Listen to forced logouts (e.g. from 401 response interceptor)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('FORCE_LOGOUT', () => {
      logout();
    });
    return () => sub.remove();
  }, [logout]);

  // -------------------------------------------------------
  // updateUser: Update user info in context after profile edit
  // -------------------------------------------------------
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newUser = { ...prev, ...updatedUser };
      // Also update the stored version so it persists
      AsyncStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// -------------------------------------------------------
// useAuth hook — the clean way to access auth context
// -------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // This error helps developers catch mistakes (using hook outside provider)
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
