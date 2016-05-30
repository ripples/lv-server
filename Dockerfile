FROM molecularplayground/node-js
RUN apk add bash

COPY . /src

WORKDIR /src

RUN npm install

CMD ["npm", "run", "start-dev"]

EXPOSE 3000
