import type { AuthUser } from './authUser';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};