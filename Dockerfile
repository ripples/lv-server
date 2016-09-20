FROM node:6.2.2

COPY . /src

WORKDIR /src

RUN npm install --prod

CMD ["npm", "start"]
