FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN npm install --legacy-peer-deps
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EXPOSE 3000