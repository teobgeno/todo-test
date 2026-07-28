# deps: install dependencies once, reused by the dev stage
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# dev: Vite dev server with HMR, source is bind-mounted by docker-compose
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
