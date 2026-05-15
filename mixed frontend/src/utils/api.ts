import { AppData } from "../store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = 'mh_auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

interface FetchOptions extends RequestInit {
  data?: any;
}

// Event system to notify App component of 401s
type AuthListener = () => void;
const authListeners: AuthListener[] = [];
export const onAuthError = (listener: AuthListener) => {
  authListeners.push(listener);
};
const triggerAuthError = () => {
  removeToken();
  authListeners.forEach(l => l());
};

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  const response = await fetch(url, config);

  if (response.status === 401 || response.status === 403) {
    triggerAuthError();
    throw new Error('Authentication failed or expired. Please log in again.');
  }

  if (!response.ok) {
    let message = 'API Request Failed';
    try {
      const errData = await response.json();
      message = errData.message || message;
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(message);
  }

  return response.json();
}

export const authAPI = {
  login: (username: string, password: string) => 
    apiFetch('/api/auth/login', {
      method: 'POST',
      data: { username, password }
    })
};

export const stateAPI = {
  fetchState: (): Promise<AppData> => 
    apiFetch('/api/state', { method: 'GET' }),
  
  saveState: (data: AppData): Promise<{ message: string }> => 
    apiFetch('/api/state', {
      method: 'POST',
      data
    })
};
