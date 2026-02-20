import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { formsRouter } from './routes/forms.js';
import { adminRouter } from './routes/admin.js';
import { ZodError } from 'zod';

const app = express();
app.use(
  cors({
    origin: [env.frontendOrigin],
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'harmony-backend',
    timestamp: new Date().toISOString(),
  }),
);
app.get('/config/status', (_req, res) => {
  res.json({
    emailEnabled: env.enableEmail,
    pdfExportEnabled: env.enablePdfExport,
  });
});

app.use('/auth', authRouter);
app.use('/forms', formsRouter);
app.use('/admin', adminRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.issues,
    });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});
