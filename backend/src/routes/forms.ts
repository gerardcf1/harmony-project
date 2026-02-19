import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { computeHarmonyScore } from '../services/scoring.js';

export const formsRouter = Router();
formsRouter.use(requireAuth);

formsRouter.get('/my-assigned', async (req, res) => {
  const userId = req.user!.userId;
  const assigned = await prisma.form.findMany({
    where: {
      isActive: true,
      OR: [{ isDefault: true }, { assignments: { some: { userId, active: true } } }],
    },
    include: { categories: { include: { questions: { include: { answers: true } } } } },
  });
  res.json(assigned);
});

formsRouter.post('/', requireRole('ADMIN'), async (req, res) => {
  const schema = z.object({
    title: z.string(),
    description: z.string().optional(),
    isDefault: z.boolean().default(false),
    categories: z.array(
      z.object({
        name: z.string(),
        weight: z.number().positive(),
        questions: z.array(
          z.object({ prompt: z.string(), answers: z.array(z.object({ label: z.string(), value: z.number().int() })) }),
        ),
      }),
    ),
  });

  const payload = schema.parse(req.body);
  const created = await prisma.form.create({
    data: {
      title: payload.title,
      description: payload.description,
      isDefault: payload.isDefault,
      createdById: req.user!.userId,
      categories: {
        create: payload.categories.map((cat) => ({
          name: cat.name,
          weight: cat.weight,
          questions: { create: cat.questions.map((q) => ({ prompt: q.prompt, answers: { create: q.answers } })) },
        })),
      },
    },
  });

  res.status(201).json(created);
});

formsRouter.post('/:formId/submit', async (req, res) => {
  const schema = z.object({ responses: z.array(z.object({ questionId: z.string(), answerOptionId: z.string() })) });
  const { responses } = schema.parse(req.body);

  const answerIds = responses.map((r) => r.answerOptionId);
  const selectedAnswers = await prisma.answerOption.findMany({
    where: { id: { in: answerIds } },
    include: { question: { include: { category: true, answers: true } } },
  });

  const score = computeHarmonyScore(
    selectedAnswers.map((ans) => ({
      categoryWeight: ans.question.category.weight,
      questionMax: Math.max(...ans.question.answers.map((a) => a.value)),
      selectedValue: ans.value,
    })),
  );

  const submission = await prisma.submission.create({
    data: {
      userId: req.user!.userId,
      formId: req.params.formId,
      totalScore: score.totalScore,
      normalizedScore: score.normalizedScore,
      label: score.label,
      responses: { create: responses },
    },
  });

  res.status(201).json(submission);
});

formsRouter.get('/my-submissions', async (req, res) => {
  const submissions = await prisma.submission.findMany({ where: { userId: req.user!.userId }, include: { form: true }, orderBy: { createdAt: 'desc' } });
  const average = submissions.length ? submissions.reduce((a, s) => a + s.normalizedScore, 0) / submissions.length : 0;
  res.json({ submissions, stats: { averageScore: Number(average.toFixed(2)), totalSubmissions: submissions.length } });
});
