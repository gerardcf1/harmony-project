import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({ include: { submissions: { include: { form: true } } }, orderBy: { createdAt: 'desc' } });
  res.json(users);
});

adminRouter.patch('/users/:userId/block', async (req, res) => {
  const schema = z.object({ isBlocked: z.boolean() });
  const { isBlocked } = schema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.userId }, data: { isBlocked } });
  await prisma.auditLog.create({
    data: { action: isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER', targetType: 'User', targetId: user.id, actorId: req.user!.userId, metadata: { email: user.email } },
  });
  res.json(user);
});

adminRouter.post('/assign-form', async (req, res) => {
  const schema = z.object({ userId: z.string(), formId: z.string() });
  const { userId, formId } = schema.parse(req.body);
  const assignment = await prisma.assignment.upsert({
    where: { userId_formId: { userId, formId } },
    create: { userId, formId, active: true },
    update: { active: true },
  });
  res.status(201).json(assignment);
});

adminRouter.get('/export/csv', async (_req, res) => {
  const rows = await prisma.submission.findMany({ include: { user: true, form: true } });
  const csv = ['name,email,form,score,label,date', ...rows.map((r) => `${r.user.firstName} ${r.user.lastName},${r.user.email},${r.form.title},${r.normalizedScore},${r.label},${r.createdAt.toISOString()}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});
