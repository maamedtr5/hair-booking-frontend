// src/utils/csrf.ts
//
// The CSRF cookie is deliberately NOT httpOnly (see the backend's
// authCookies.js for why) — reading it here and echoing it back as a
// header is exactly the "double submit" half of the CSRF defense. This
// is the one piece of auth state that's still fine to read from
// document.cookie: unlike the session JWT, this value on its own can't
// be used to authenticate as anyone — it only matters paired with the
// session cookie the browser already controls sending.
export function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
