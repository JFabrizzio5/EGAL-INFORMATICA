# Dockerfile
FROM node:20

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 19000 19001 19002 19006

CMD ["npx", "expo", "start", "--tunnel"]
