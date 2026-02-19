import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  'Family/Love',
  'Financial',
  'Community/Social',
  'Career',
  'Emotional',
  'Spiritual',
  'Intellectual/Creative',
  'Physical',
  'Environmental',
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.response.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();
  await prisma.form.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@harmony.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-0100',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'user@harmony.local',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Patient',
      phone: '555-0101',
      role: 'USER',
      emailVerified: true,
    },
  });

  await prisma.form.create({
    data: {
      title: 'Harmony Baseline Assessment',
      description: 'Rank impact between categories using -1 / 0 / +1 scoring.',
      isDefault: true,
      createdById: admin.id,
      categories: {
        create: categories.map((name) => ({
          name,
          weight: 1,
          questions: {
            create: {
              prompt: `How is ${name} currently affecting your overall well-being?`,
              answers: {
                create: [
                  { label: 'Negatively affects', value: -1 },
                  { label: 'No affect', value: 0 },
                  { label: 'Positively affects', value: 1 },
                ],
              },
            },
          },
        })),
      },
    },
  });
}

main().finally(async () => prisma.$disconnect());
