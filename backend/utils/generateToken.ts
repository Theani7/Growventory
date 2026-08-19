import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';

// Generate JWT token for authenticated user
const generateToken = (payload: JwtPayload & { userId: number; roleId: number }): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
};

// Verify JWT token
const verifyToken = (token: string): string | JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export { generateToken, verifyToken };