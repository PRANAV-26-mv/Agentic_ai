import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000, // 12-second timeout to handle poor 2G/3G connections cleanly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cache key generator for GET requests
const getCacheKey = (config: AxiosRequestConfig): string => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `portal_cache_${url}_${params}`;
};

// Safe localStorage set with quota recovery
const safeCacheSet = (key: string, data: any) => {
  try {
    const record = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(key, JSON.stringify(record));
  } catch (e) {
    try {
      // Purge oldest cache items if storage quota is tight
      const keys = Object.keys(localStorage).filter(k => k.startsWith('portal_cache_'));
      for (let i = 0; i < Math.min(10, keys.length); i++) {
        localStorage.removeItem(keys[i]);
      }
    } catch (_) {}
  }
};

// Safe localStorage getter
const safeCacheGet = (key: string): any | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (e) {
    return null;
  }
};

// Interceptor to attach JWT token to every request and correctly handle FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, remove Content-Type so browser/axios sets multipart/form-data with boundary
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

// Helper to resolve backend-served file URLs
export const getFileUrl = (url?: string): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Queue for offline mutations that should sync automatically
export interface QueuedOfflineRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export const getOfflineQueue = (): QueuedOfflineRequest[] => {
  try {
    return JSON.parse(localStorage.getItem('portal_offline_queue') || '[]');
  } catch (e) {
    return [];
  }
};

export const queueOfflineRequest = (url: string, method: string, data: any) => {
  try {
    const queue = getOfflineQueue();
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url,
      method,
      data,
      timestamp: Date.now()
    });
    localStorage.setItem('portal_offline_queue', JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('portal:queue_updated', { detail: { count: queue.length } }));
  } catch (e) {}
};

export const flushOfflineQueue = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: QueuedOfflineRequest[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.method.toLowerCase() === 'post') {
        await api.post(item.url, item.data, { _isSyncRetry: true } as any);
      } else if (item.method.toLowerCase() === 'put') {
        await api.put(item.url, item.data, { _isSyncRetry: true } as any);
      }
      syncedCount++;
    } catch (err: any) {
      // If server returned 4xx (client error or attempt already completed), drop it to prevent permanent blocking
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        // Discard failed client request
      } else {
        remaining.push(item);
      }
    }
  }

  localStorage.setItem('portal_offline_queue', JSON.stringify(remaining));
  window.dispatchEvent(new CustomEvent('portal:queue_updated', { detail: { count: remaining.length } }));
  if (syncedCount > 0) {
    window.dispatchEvent(new CustomEvent('portal:network_status', { 
      detail: { type: 'SYNCED', count: syncedCount, message: `Synced ${syncedCount} offline record(s) with server` } 
    }));
  }
};

// Response interceptor with caching, offline fallback, and auto-retry for GET requests
api.interceptors.response.use(
  (response) => {
    // If successful GET request, cache the data for resilient offline & low-network access
    if (response.config.method?.toLowerCase() === 'get' && response.data) {
      const isAuthEndpoint = response.config.url?.includes('/auth/login') || response.config.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        const cacheKey = getCacheKey(response.config);
        safeCacheSet(cacheKey, response.data);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle authentication expiration or restricted user
    if (error.response?.status === 401 || (error.response?.status === 403 && error.response?.data?.is_restricted)) {
      localStorage.removeItem('portal_auth_token');
      localStorage.removeItem('portal_auth_user');

      if (error.response?.data?.is_restricted && error.response?.data?.message) {
        sessionStorage.setItem('portal_restriction_msg', error.response.data.message);
      }

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error') || error.message?.includes('timeout');

    // 1. Automatic Retry for GET requests on network drops / timeouts
    if (config && config.method?.toLowerCase() === 'get' && isNetworkError) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < 2 && navigator.onLine) {
        config.__retryCount += 1;
        const delay = config.__retryCount * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }

      // 2. Offline / Low-Network Fallback for GET requests
      const cacheKey = getCacheKey(config);
      const cachedData = safeCacheGet(cacheKey);
      if (cachedData !== null) {
        window.dispatchEvent(new CustomEvent('portal:network_status', {
          detail: {
            type: 'CACHE_FALLBACK',
            url: config.url,
            isOffline: !navigator.onLine,
            message: 'Low network: Serving verified offline cache'
          }
        }));

        return Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (Offline Cache)',
          headers: {},
          config,
          isCached: true
        } as AxiosResponse);
      }
    }

    // 3. Queue offline answer saves and tab-switch records if disconnected
    if (config && config.method?.toLowerCase() === 'post' && isNetworkError && !(config as any)._isSyncRetry) {
      const isQueueable = config.url?.includes('/answer') || config.url?.includes('tab-switch');
      if (isQueueable) {
        let payload = config.data;
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch (_) {}
        }
        queueOfflineRequest(config.url, 'post', payload);
        window.dispatchEvent(new CustomEvent('portal:network_status', {
          detail: {
            type: 'MUTATION_QUEUED',
            url: config.url,
            message: 'Draft response saved locally. Synchronizing automatically when connected.'
          }
        }));
        return Promise.resolve({
          data: { success: true, offline_queued: true },
          status: 200,
          statusText: 'OK (Queued Offline)',
          headers: {},
          config
        } as AxiosResponse);
      }
    }

    return Promise.reject(error);
  }
);

// Listen to browser network changes to auto-flush offline queue
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(flushOfflineQueue, 1500);
  });
}
