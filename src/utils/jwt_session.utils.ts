import jwt, { JwtPayload } from 'jsonwebtoken';

export function signAccessToken(payload: Record<string, any>): string {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m' });
}

export function signRefreshToken(payload: Record<string, any>): string {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '21d' });
}

export function verifyAccessToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid access token');
    }
}

export function verifyRefreshToken(token: string): JwtPayload {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
}