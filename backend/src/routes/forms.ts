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
    include: {
      categories: {
        include: {
          questions: {
            include: { answers: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assigned);
});

formsRouter.get('/:formId', async (req, res) => {
  const form = await prisma.form.findUnique({
    where: { id: req.params.formId },
    include: {
      categories: {
        include: {
          questions: {
            include: { answers: true },
          },
        },
      },
      assignments: true,
    },
  });

  if (!form) return res.status(404).json({ message: 'Form not found' });

  if (
    req.user?.role !== 'ADMIN' &&
    !form.isDefault &&
    !form.assignments.some((a: any) => a.userId === req.user!.userId && a.active)
  ) {
    return res.status(403).json({ message: 'Form not assigned' });
  }

  return res.json(form);
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
          z.object({
            prompt: z.string(),
            answers: z.array(z.object({ label: z.string(), value: z.number().int() })),
          }),
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
    include: { categories: { include: { questions: { include: { answers: true } } } } },
  });

  res.status(201).json(created);
});

formsRouter.post('/:formId/submit', async (req, res) => {
  const schema = z.object({ responses: z.array(z.object({ questionId: z.string(), answerOptionId: z.string() })).min(1) });
  const { responses } = schema.parse(req.body);

  const answerIds = responses.map((r) => r.answerOptionId);
  const selectedAnswers = await prisma.answerOption.findMany({
    where: { id: { in: answerIds } },
    include: { question: { include: { category: true, answers: true } } },
  });

  const score = computeHarmonyScore(
    selectedAnswers.map((ans: any) => ({
      categoryWeight: ans.question.category.weight,
      questionMax: Math.max(...ans.question.answers.map((a: any) => a.value)),
      selectedValue: ans.value,
    })),
  );

  const categoryScores: Record<string, { weighted: number; raw: number; count: number }> = {};
  selectedAnswers.forEach((ans: any) => {
    const key = ans.question.category.name;
    const weighted = ans.value * ans.question.category.weight;
    categoryScores[key] = categoryScores[key] ?? { weighted: 0, raw: 0, count: 0 };
    categoryScores[key].weighted += weighted;
    categoryScores[key].raw += ans.value;
    categoryScores[key].count += 1;
  });

  const submission = await prisma.submission.create({
    data: {
      userId: req.user!.userId,
      formId: req.params.formId,
      totalScore: score.totalScore,
      normalizedScore: score.normalizedScore,
      label: score.label,
      answersJson: responses,
      computedScoresJson: categoryScores,
      responses: { create: responses },
    },
  });

  res.status(201).json(submission);
});

formsRouter.get('/my-submissions', async (req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { userId: req.user!.userId },
    include: { form: true },
    orderBy: { createdAt: 'desc' },
  });
  const average = submissions.length ? submissions.reduce((a: number, s: any) => a + s.normalizedScore, 0) / submissions.length : 0;
  res.json({ submissions, stats: { averageScore: Number(average.toFixed(2)), totalSubmissions: submissions.length } });
});
