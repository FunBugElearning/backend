import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { verifyAccessToken } from '../utils/jwt_session.utils';

type AdminAuthorizationResult =
  | {
      ok: true;
      userId: number;
    }
  | {
      ok: false;
      status: 'unauthorized' | 'forbidden';
      message: string;
    };

export async function verifyAdminRole(
  req: Request,
  prisma: PrismaService,
): Promise<AdminAuthorizationResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Missing or invalid authorization header',
    };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token is missing',
    };
  }

  let payload: { userId?: unknown };

  try {
    payload = verifyAccessToken(token) as { userId?: unknown };
  } catch {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Invalid access token',
    };
  }

  const parsedUserId = Number(payload.userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token payload is invalid',
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    include: { role: true },
  });

  if (!user) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'User is not found',
    };
  }

  if (user.role?.name.toLowerCase() !== 'admin') {
    return {
      ok: false,
      status: 'forbidden',
      message: 'Admin role is required',
    };
  }

  return {
    ok: true,
    userId: user.id,
  };
}

export async function verifyAdminTeacherRole(
  req: Request,
  prisma: PrismaService,
): Promise<AdminAuthorizationResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Missing or invalid authorization header',
    };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token is missing',
    };
  }

  let payload: { userId?: unknown };

  try {
    payload = verifyAccessToken(token) as { userId?: unknown };
  } catch {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Invalid access token',
    };
  }

  const parsedUserId = Number(payload.userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token payload is invalid',
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    include: { role: true },
  });

  if (!user) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'User is not found',
    };
  }

  if (
    user.role?.name.toLowerCase() !== 'admin' &&
    user.role?.name.toLowerCase() !== 'teacher'
  ) {
    return {
      ok: false,
      status: 'forbidden',
      message: 'Admin or teacher role is required',
    };
  }

  return {
    ok: true,
    userId: user.id,
  };
}

type AuthenticatedUserResult =
  | {
      ok: true;
      userId: number;
      role: string;
    }
  | {
      ok: false;
      status: 'unauthorized';
      message: string;
    };

export async function verifyAuthenticatedUser(
  req: Request,
  prisma: PrismaService,
): Promise<AuthenticatedUserResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Missing or invalid authorization header',
    };
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token is missing',
    };
  }

  let payload: { userId?: unknown };

  try {
    payload = verifyAccessToken(token) as { userId?: unknown };
  } catch {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Invalid access token',
    };
  }

  const userId = Number(payload.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'Access token payload is invalid',
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    return {
      ok: false,
      status: 'unauthorized',
      message: 'User is not found',
    };
  }

  return {
    ok: true,
    userId: user.id,
    role: user.role.name,
  };
}
