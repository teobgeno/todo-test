# deps: install dependencies once, reused by dev and build stages
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# dev: Vite dev server with HMR, source is bind-mounted by docker-compose
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# build: compile to static assets in dist/
FROM deps AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN npm run build

# runtime: static assets served by nginx
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
