FROM node:20-alpine
WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

# Prisma generate requires a DATABASE_URL at build time for schema validation.
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/harmony"
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY tests ./tests
CMD ["sh", "-c", "npx prisma db push && npm run seed && npm run dev"]
