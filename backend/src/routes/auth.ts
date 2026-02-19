import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { comparePassword, hashPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth.js';
import { z } from 'zod';
import crypto from 'crypto';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8), firstName: z.string(), lastName: z.string(), phone: z.string().optional() });
  const payload = schema.parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email: payload.email } });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash: await hashPassword(payload.password),
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
    },
  });

  res.status(201).json({ id: user.id, email: user.email });
});

authRouter.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string() });
  const { email, password } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.isBlocked) return res.status(403).json({ message: 'User blocked by admin' });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) } });

  res.json({ accessToken, refreshToken, role: user.role, profile: { firstName: user.firstName, lastName: user.lastName } });
});

authRouter.post('/refresh', async (req, res) => {
  const schema = z.object({ refreshToken: z.string() });
  const { refreshToken } = schema.parse(req.body);
  try {
    const payload = verifyRefreshToken(refreshToken);
    const found = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!found) return res.status(401).json({ message: 'Invalid refresh token' });
    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

authRouter.post('/request-reset', async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const { email } = schema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ message: 'If the email exists, reset instructions were generated.' });

  const token = crypto.randomBytes(16).toString('hex');
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  res.json({ message: 'Reset token generated in dev mode.', token });
});

authRouter.post('/reset-password', async (req, res) => {
  const schema = z.object({ token: z.string(), password: z.string().min(8) });
  const { token, password } = schema.parse(req.body);
  const found = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!found || found.used || found.expiresAt < new Date()) return res.status(400).json({ message: 'Invalid token' });

  await prisma.user.update({ where: { id: found.userId }, data: { passwordHash: await hashPassword(password) } });
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
  res.json({ message: 'Password updated' });
});
