FROM node:6.2.2

COPY . /src

WORKDIR /src

RUN npm install -g yarn
RUN yarn install --production

CMD ["yarn", "start"]
