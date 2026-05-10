FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000 4000 50052 50053 50054

CMD ["node", "gateway/gateway.js"]
