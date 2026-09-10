# Stage dev: build TS then serve dist (no Vite, plain React + TS)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_BASE_URL
ARG TILES_PER_PAGE
ENV API_BASE_URL=$API_BASE_URL
ENV TILES_PER_PAGE=$TILES_PER_PAGE
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p dist && cat > dist/config.js <<EOF\nwindow.__APP_CONFIG__ = { API_BASE_URL: \"${API_BASE_URL:-https://dummyjson.com/products}\", TILES_PER_PAGE: \"${TILES_PER_PAGE:-16}\" };\nEOF\ncat dist/config.js && npx serve dist -l 3000"]

# Stage build: compile TS
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage prod: serve compiled dist via nginx
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
