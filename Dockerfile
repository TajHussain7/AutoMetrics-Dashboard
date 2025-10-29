FROM node:22-alpine

WORKDIR /api/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Build client + server (if vite is used)
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Expose container port (Back4App will map this dynamically)
EXPOSE 8000

# Start the production server
CMD ["npm", "start"]
