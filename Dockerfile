FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

# Set PORT
EXPOSE 3000
EXPOSE 3001

# Start the application
CMD ["src/index.mjs"]
