import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { formsRouter } from './routes/forms.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/forms', formsRouter);
app.use('/admin', adminRouter);

app.listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});
