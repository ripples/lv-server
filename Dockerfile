FROM molecularplayground/node-js
RUN apk add --no-cache bash

COPY . /src

WORKDIR /src

RUN npm install

RUN npm install -g node-inspector

CMD ["npm", "run", "start-dev"]

EXPOSE 3000
