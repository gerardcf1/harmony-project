import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signAccessToken = (payload: { userId: string; role: string }) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' });

export const signRefreshToken = (payload: { userId: string; role: string }) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: '7d' });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.jwtSecret) as { userId: string; role: any };
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.jwtRefreshSecret) as { userId: string; role: any };
