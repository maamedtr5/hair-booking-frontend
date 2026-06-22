export * from './models';

// src/types/index.ts
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  token: string; // JWT token
}
