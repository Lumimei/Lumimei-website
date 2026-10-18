export { firebaseConfig } from '../lib/firebase';

/**
 * Global Application Configuration & Switches
 * 
 * GEMINI_ENABLED:
 * Set to false (OFF) to ensure zero Gemini API requests leave the application.
 */
export const isGeminiApiEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('lumimei_gemini_api_enabled');
  if (stored === null) {
    return false; // Default OFF
  }
  return stored === 'true';
};

export const setGeminiApiEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lumimei_gemini_api_enabled', enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('gemini_api_status_changed', { detail: { enabled } }));
  }
};

export const GEMINI_ENABLED: boolean = false;
