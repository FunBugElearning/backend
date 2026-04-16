import jwt, { JwtPayload } from 'jsonwebtoken';

export function signAccessToken(payload: Record<string, unknown>): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not defined');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return jwt.sign(payload, secret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
  });
}

export function signRefreshToken(payload: Record<string, unknown>): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not defined');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return jwt.sign(payload, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '21d',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not defined');
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    throw new Error('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not defined');
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    throw new Error('Invalid refresh token');
  }
}
