/**
 * Workflow Session Management
 *
 * Enables multiple independent workflow instances in different browser tabs
 * by scoping localStorage keys to a session ID from the URL.
 */

const SESSION_PARAM = 'session';

/**
 * Generate a short random session ID
 */
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 8);
};

/**
 * Get session ID from URL, or generate one and update URL
 */
export const getOrCreateSessionId = (): string => {
  const url = new URL(window.location.href);
  let sessionId = url.searchParams.get(SESSION_PARAM);

  if (!sessionId) {
    sessionId = generateSessionId();
    url.searchParams.set(SESSION_PARAM, sessionId);
    // Update URL without reload
    window.history.replaceState({}, '', url.toString());
  }

  return sessionId;
};

/**
 * Get session ID from URL (returns null if not present)
 */
export const getSessionId = (): string | null => {
  const url = new URL(window.location.href);
  return url.searchParams.get(SESSION_PARAM);
};

/**
 * Create a session-scoped storage key
 */
export const getSessionStorageKey = (baseKey: string, sessionId: string): string => {
  return `${baseKey}:${sessionId}`;
};

/**
 * Open a new workflow session in a new tab
 */
export const openNewSession = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.set(SESSION_PARAM, generateSessionId());
  window.open(url.toString(), '_blank');
};
