FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
# Fix for npm optional dependencies bug on ARM64
# Remove package-lock.json to force fresh install of optional deps
RUN rm -f package-lock.json && \
    npm install && \
    npm rebuild 2>/dev/null || true

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
