/**
 * Extract a human-readable error message from an API error.
 *
 * Handles Axios errors (with response.data.detail from FastAPI),
 * standard Error instances, and unknown error types.
 */
import { AxiosError } from 'axios';

export function extractApiError(err: unknown, fallback = 'An unexpected error occurred'): string {
  // Axios error with FastAPI JSON response
  if (err instanceof AxiosError && err.response?.data) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    // FastAPI validation errors return detail as array
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
    }
  }

  // Standard Error
  if (err instanceof Error) return err.message;

  // Unknown
  return fallback;
}
