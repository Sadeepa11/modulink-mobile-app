// ============================================================
// API Service
//
// Why not "localhost"?
//   "localhost" on an Android device/emulator points to the
//   device itself, not your PC.  Use the PC's real network IP.
//
// Your PC's WiFi IP:  192.168.87.154
//   → works for Android emulator AND physical devices on the same WiFi
//   → to find your IP again: run in PowerShell:
//       (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like '*Wi-Fi*'}).IPAddress
//
// Web / iOS simulator only:
//   Set WEB_MODE = true to use localhost instead
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform, DeviceEventEmitter } from 'react-native';

import Logger from '@/utils/logger';

// ── Configuration ─────────────────────────────────────────────
// PC's WiFi IP — change this if your network IP changes
const PC_IP   = '192.168.87.154';
const PORT    = 5000;

// Set true only when running in a web browser (npx expo start --web)
const WEB_MODE = false;

export const API_BASE_URL =
  WEB_MODE || Platform.OS === 'web'
    ? `http://localhost:${PORT}`       // Web browser — localhost works
    : `http://${PC_IP}:${PORT}`;       // Android/iOS — use real network IP

Logger.info(`API → ${API_BASE_URL}`);

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach token + log ─────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const body =
      config.data instanceof FormData ? '(FormData)' : config.data;
    Logger.api.request(config.method ?? 'GET', config.url ?? '', body);

    return config;
  },
  (error) => {
    Logger.api.error('REQ_ERR', error.config?.url ?? '?', error.message);
    return Promise.reject(error);
  }
);

// ── Response interceptor — log result or error ───────────────
api.interceptors.response.use(
  (response) => {
    Logger.api.response(response.status, response.config.url ?? '', response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status ?? 'NO_RESPONSE';
    const url    = error.config?.url ?? '?';
    const msg    = error.response?.data?.error ?? error.message ?? 'Unknown error';

    Logger.api.error(status, url, msg, error.response?.data);

    if (!error.response) {
      Logger.error(
        `Network error — cannot reach ${API_BASE_URL}\n` +
        `  Make sure the backend is running: cd backend && npm run dev\n` +
        `  Make sure your phone/emulator is on the same WiFi as this PC`,
        { code: error.code, url }
      );
    }

    if (status === 401) {
      Logger.auth('Token expired — clearing storage');
      await AsyncStorage.multiRemove(['token', 'user']);
      DeviceEventEmitter.emit('FORCE_LOGOUT');
    }

    return Promise.reject(error);
  }
);

export default api;
