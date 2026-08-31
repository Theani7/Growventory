import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

// Generate JWT token for authenticated user
const generateToken = (payload: JwtPayload & { userId: number; roleId: number }): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(payload, getJwtSecret(), { expiresIn, algorithm: 'HS256' });
};

// Verify JWT token
const verifyToken = (token: string): string | JwtPayload => {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
};

export { generateToken, verifyToken };