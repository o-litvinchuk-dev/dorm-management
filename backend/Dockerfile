FROM node:23-alpine
WORKDIR /app
COPY package*.json ./
# Встановлюємо всі залежності, включаючи devDependencies
RUN npm install
COPY . .
EXPOSE 5000
# Використовуємо nodemon для розробки
CMD ["./wait-for-it.sh", "mysql:3306", "--", "npm", "run", "dev"]