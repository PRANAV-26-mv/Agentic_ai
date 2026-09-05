import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminsModel, StudentsModel, Admin, Student } from '../models/dbModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'portal-super-secret-jwt-key-2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
  student?: Student;
  admin?: Admin;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Your session has expired. Please login again.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    if (decoded.role === 'ADMIN') {
      const admin = AdminsModel.findById(decoded.id);
      if (!admin) {
        res.status(401).json({ message: 'Admin account not found or deactivated.' });
        return;
      }
      req.user = { ...decoded, admin };
    } else if (decoded.role === 'STUDENT') {
      const student = StudentsModel.findById(decoded.id);
      if (!student || student.status === 'INACTIVE') {
        res.status(401).json({ message: 'Student account not found or deactivated.' });
        return;
      }
      req.user = { ...decoded, student };
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Your session has expired. Please login again.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Access Denied. Admin privileges required.' });
      return;
    }
    next();
  });
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({ message: 'Access Denied. Student privileges required.' });
      return;
    }
    next();
  });
}
