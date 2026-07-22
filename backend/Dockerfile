# deps: install dependencies once, reused by dev and build stages
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# dev: hot-reloading dev server, source is bind-mounted by docker-compose
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# build: compile TypeScript to dist/
FROM deps AS build
COPY . .
RUN npm run build

# runtime: minimal production image, only prod deps + compiled output
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
