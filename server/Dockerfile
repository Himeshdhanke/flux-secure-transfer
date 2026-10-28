FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies for native modules and fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
