FROM node:23-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["./wait-for-it.sh", "mysql:3306", "--", "npm", "start"]