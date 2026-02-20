import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { env } from '../config/env.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/users', async (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const users = await prisma.user.findMany({ include: { submissions: { include: { form: true } } }, orderBy: { createdAt: 'desc' } });
  const filtered = q
    ? users.filter((u: any) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
    : users;
  res.json(filtered);
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

adminRouter.get('/forms', async (_req, res) => {
  const forms = await prisma.form.findMany({
    include: { categories: { include: { questions: { include: { answers: true } } } }, assignments: true, _count: { select: { submissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(forms);
});

adminRouter.put('/forms/:formId', async (req, res) => {
  const schema = z.object({ title: z.string(), description: z.string().optional(), isDefault: z.boolean(), categories: z.array(z.object({ id: z.string().optional(), name: z.string(), weight: z.number().positive(), questions: z.array(z.object({ id: z.string().optional(), prompt: z.string(), answers: z.array(z.object({ id: z.string().optional(), label: z.string(), value: z.number().int() })) })) })) });
  const payload = schema.parse(req.body);

  await prisma.$transaction(async (tx: any) => {
    await tx.response.deleteMany({ where: { question: { category: { formId: req.params.formId } } } });
    await tx.answerOption.deleteMany({ where: { question: { category: { formId: req.params.formId } } } });
    await tx.question.deleteMany({ where: { category: { formId: req.params.formId } } });
    await tx.category.deleteMany({ where: { formId: req.params.formId } });

    await tx.form.update({
      where: { id: req.params.formId },
      data: {
        title: payload.title,
        description: payload.description,
        isDefault: payload.isDefault,
        categories: {
          create: payload.categories.map((cat) => ({
            name: cat.name,
            weight: cat.weight,
            questions: {
              create: cat.questions.map((q) => ({
                prompt: q.prompt,
                answers: { create: q.answers.map((a: any) => ({ label: a.label, value: a.value })) },
              })),
            },
          })),
        },
      },
    });
  });

  res.json({ message: 'Form updated' });
});

adminRouter.delete('/forms/:formId', async (req, res) => {
  await prisma.form.update({ where: { id: req.params.formId }, data: { isActive: false } });
  res.json({ message: 'Form archived' });
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

adminRouter.get('/submissions', async (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const formId = String(req.query.formId ?? '');

  const submissions = await prisma.submission.findMany({
    where: {
      ...(formId ? { formId } : {}),
    },
    include: {
      user: true,
      form: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const filtered = q
    ? submissions.filter((s: any) => `${s.user.firstName} ${s.user.lastName} ${s.user.email} ${s.form.title}`.toLowerCase().includes(q))
    : submissions;

  res.json(filtered);
});

adminRouter.patch('/submissions/:submissionId', async (req, res) => {
  const schema = z.object({ label: z.string().optional(), normalizedScore: z.number().optional() });
  const payload = schema.parse(req.body);
  const updated = await prisma.submission.update({ where: { id: req.params.submissionId }, data: payload });
  res.json(updated);
});

adminRouter.delete('/submissions/:submissionId', async (req, res) => {
  await prisma.submission.delete({ where: { id: req.params.submissionId } });
  res.json({ message: 'Submission deleted' });
});

function toRows(items: Awaited<ReturnType<typeof prisma.submission.findMany>>) {
  return items.map((r: any) => ({
    name: `${r.user.firstName} ${r.user.lastName}`,
    email: r.user.email,
    form: r.form.title,
    score: r.normalizedScore,
    label: r.label,
    date: r.createdAt.toISOString(),
  }));
}

adminRouter.get('/export/csv', async (_req, res) => {
  const rows = await prisma.submission.findMany({ include: { user: true, form: true } });
  const csv = ['name,email,form,score,label,date', ...toRows(rows).map((r: any) => `${r.name},${r.email},${r.form},${r.score},${r.label},${r.date}`)].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  res.send(csv);
});

adminRouter.get('/export/excel', async (_req, res) => {
  const rows = await prisma.submission.findMany({ include: { user: true, form: true } });
  const header = 'name	email	form	score	label	date';
  const body = toRows(rows).map((r: any) => `${r.name}	${r.email}	${r.form}	${r.score}	${r.label}	${r.date}`).join('\n');
  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.xls"');
  res.send(`${header}\n${body}`);
});

adminRouter.get('/export/pdf', async (_req, res) => {
  if (!env.enablePdfExport) {
    return res.status(503).json({ message: 'PDF export disabled by feature flag ENABLE_PDF_EXPORT=false' });
  }
  return res.status(501).json({ message: 'PDF export not implemented yet' });
});
