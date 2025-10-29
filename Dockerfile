FROM node:22-alpine

WORKDIR /api/app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "start"]
