FROM node:14

WORKDIR /usr/src/app


COPY package*.json ./

RUN npm install 

RUN npm install glob rimraf

COPY . .

RUN npm run build

EXPOSE 8080
CMD [ "npm", "run", "start:prod" ]