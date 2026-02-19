FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY tests ./tests
CMD ["sh", "-c", "npx prisma db push && npm run seed && npm run dev"]
