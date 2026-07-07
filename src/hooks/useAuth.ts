// src/hooks/useAuth.ts
//
// `useAuth` is kept only because ProtectedRoute.tsx (and possibly other
// files) import it by this name. It must NOT reimplement
// useContext(AuthContext) — that's a second, independent copy of the same
// logic, and independent copies drift. (This is exactly how useAuth ended
// up with a different return type than useAuthcontext.ts's version, even
// though both were meant to expose the same thing.)
//
// Single source of truth: useAuthcontext.ts. Everything else is an alias.
export { useAuthContext as useAuth } from './useAuthcontext';