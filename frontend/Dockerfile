FROM node:23-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN npm install 
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EXPOSE 3000