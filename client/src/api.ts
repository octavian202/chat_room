import axios, { type AxiosError } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  fieldErrors?: { field: string; message: string }[];
}

export function getApiBase(): string {
  return API_BASE;
}

export function getApiUrl(path: string): string {
  const base = API_BASE || window.location.origin;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Extract a user-friendly error message from an axios error.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<ApiErrorResponse>;
    const data = err.response?.data;
    if (data?.message) {
      if (data.fieldErrors && data.fieldErrors.length > 0) {
        const fieldParts = data.fieldErrors.map((f) => `${f.field}: ${f.message}`);
        return `${data.message} ${fieldParts.join('; ')}`;
      }
      return data.message;
    }
    if (data?.error) {
      return data.error;
    }
    if (err.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (err.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    if (err.response?.status) {
      return `Request failed with status ${err.response.status}.`;
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection and try again.';
    }
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    return err.message || 'An unexpected error occurred.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
