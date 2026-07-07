// src/types/index.ts
//
// This barrel exists so files can `import { X } from '../types'` instead of
// '../types/models'. It must only ever re-export models.ts — models.ts is
// the single source of truth for every model shape (validated against the
// Prisma schema). A second, locally-declared AuthUser used to live here
// with just 4 fields (id, name, email, token), silently shadowing the real
// 9+ field AuthUser from models.ts for anyone importing from this barrel.
// That's what caused `role` and `staffId` to "not exist" even though
// models.ts had them defined correctly the whole time.
//
// Do not add model interfaces directly in this file. If a type needs to
// exist, it goes in models.ts and gets re-exported here.
export * from './models';