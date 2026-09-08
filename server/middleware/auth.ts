import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminPayload } from '../types';
import { createErrorResponse } from '../i18n';

// Extend Express Request to include decoded admin payload
declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'lumimei_admin_jwt_secret_key_2026_super_secure';
export const JWT_EXPIRES_IN = '24h';

/**
 * Helper to generate signed JWT for Admin
 */
export function signAdminToken(payload: { id: string; username: string; role: 'superadmin' | 'admin' }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * JWT Authentication Middleware for Admin routes
 */
export function verifyAdminJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers['x-access-token'] as string);

  if (!authHeader) {
    return res.status(401).json(createErrorResponse(req, 'MISSING_TOKEN'));
  }

  // Extract token from "Bearer <token>" or raw token string
  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json(createErrorResponse(req, 'MISSING_TOKEN'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.admin = decoded;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        createErrorResponse(req, 'INVALID_TOKEN', {
          expiredAt: error.expiredAt,
          reason: 'Token expired',
        })
      );
    }
    return res.status(401).json(
      createErrorResponse(req, 'INVALID_TOKEN', {
        reason: 'Token signature or format invalid',
      })
    );
  }
}

export const verifyAdmin = verifyAdminJwt;

