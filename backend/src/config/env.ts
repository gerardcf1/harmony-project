import dotenv from 'dotenv';

dotenv.config();

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

export const env = {
  port: Number(process.env.PORT ?? 8000),
  jwtSecret: process.env.JWT_SECRET ?? 'secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh',
  frontendOrigin,
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  enableEmail: process.env.ENABLE_EMAIL === 'true',
  enablePdfExport: process.env.ENABLE_PDF_EXPORT === 'true',
};
