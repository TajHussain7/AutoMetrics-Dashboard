FROM node:22-alpine

WORKDIR /api/app

COPY package*.json ./
RUN npm install    # install all deps including dev (for build)

COPY . .

RUN npm run build  # build client/server

# Now prune dev dependencies to reduce image size
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "start"]
