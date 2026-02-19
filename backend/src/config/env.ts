import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh',
};
