// ============================================================
// Native Fetch API Service (Bilingual Explanations for Viva)
//
// Syllabus / Examiner Requirement: "Fetch API / AJAX"
//
// Why this file exists:
//   Your project uses Axios, which is the industry standard.
//   But if the examiner asks "Where is Fetch API used?" or
//   asks you to write a Fetch API call during the Live Coding Challenge,
//   you can show this file or use it as a reference.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from './api';
import Logger from '@/utils/logger';

/**
 * Fetch API utility object
 */
export const fetchApi = {
  /**
   * Helper to build request headers with authentication token
   */
  getHeaders: async (customHeaders: Record<string, string> = {}) => {
    const token = await AsyncStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * GET Request
   * Usage: const data = await fetchApi.get('/users');
   */
  get: async (endpoint: string, customHeaders?: Record<string, string>) => {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = await fetchApi.getHeaders(customHeaders);

    Logger.info(`[FETCH GET] Requesting: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Logger.error(`[FETCH GET ERROR] ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * POST Request
   * Usage: const data = await fetchApi.post('/auth/login', { email, password });
   */
  post: async (endpoint: string, body: any, customHeaders?: Record<string, string>) => {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = await fetchApi.getHeaders(customHeaders);
    
    // If the body is FormData (e.g. upload images), let the browser/native fetch set the boundary
    const isFormData = body instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type']; // Browser/Fetch must set boundaries automatically
    }

    Logger.info(`[FETCH POST] Requesting: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Logger.error(`[FETCH POST ERROR] ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * PUT Request
   * Usage: const data = await fetchApi.put('/users/profile', { name, bio });
   */
  put: async (endpoint: string, body: any, customHeaders?: Record<string, string>) => {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = await fetchApi.getHeaders(customHeaders);
    
    const isFormData = body instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type'];
    }

    Logger.info(`[FETCH PUT] Requesting: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Logger.error(`[FETCH PUT ERROR] ${endpoint}`, error);
      throw error;
    }
  },

  /**
   * DELETE Request
   * Usage: await fetchApi.delete('/messages/12');
   */
  delete: async (endpoint: string, customHeaders?: Record<string, string>) => {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = await fetchApi.getHeaders(customHeaders);

    Logger.info(`[FETCH DELETE] Requesting: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Logger.error(`[FETCH DELETE ERROR] ${endpoint}`, error);
      throw error;
    }
  }
};
