const CSRF_STORAGE_KEY = 'csrf_token';

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;

  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

export function getCsrfToken(): string | null {
  if (csrfToken) {
    return csrfToken;
  }

  const storedToken = sessionStorage.getItem(CSRF_STORAGE_KEY);

  if (storedToken) {
    csrfToken = storedToken;
    return storedToken;
  }

  return null;
}

export function clearCsrfToken(): void {
  csrfToken = null;
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}