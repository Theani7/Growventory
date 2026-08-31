import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const OTP_LENGTH = 4;
export const getOTPExpiryMinutes = () => Number(process.env.OTP_EXPIRY_MINUTES) || 10;
export const OTP_EXPIRY_MINUTES = getOTPExpiryMinutes();
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const generateOTP = (): string => {
  // 4-digit: 1000-9999 - use crypto for secure randomness
  return crypto.randomInt(1000, 10000).toString();
};

export const hashOTP = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const verifyOTP = async (otp: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};

export const getExpiryDate = (minutes?: number): Date => {
  const m = minutes ?? getOTPExpiryMinutes();
  return new Date(Date.now() + m * 60 * 1000);
};
