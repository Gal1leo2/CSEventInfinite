FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest
COPY . .

# Build SvelteKit
RUN npm run build

# Expose port 3000 (default)
EXPOSE 3000

# Start server
CMD ["node", "build"]
