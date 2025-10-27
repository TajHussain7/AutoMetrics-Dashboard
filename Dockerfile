FROM node:22

# Keep it as development container
ENV NODE_ENV=development
WORKDIR /api/app

# Copy package files (glob works in shell form)
COPY package*.json ./

# Install all deps (including dev) for dev run
RUN npm install

# Copy source
COPY . .

# Expose the port your app listens on
EXPOSE 8000

# Run dev script (use exec form)
CMD ["npm", "run", "dev"]
