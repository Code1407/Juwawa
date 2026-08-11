FROM node:14

WORKDIR /usr/src/game/app

COPY game-server/package*.json ./

RUN npm config set registry https://registry.npm.taobao.org/

COPY game-server/ ./
RUN npm install pinus -g
RUN npm install
RUN npm run build

WORKDIR /usr/src/game/app/dist

CMD [ "pinus", "start" ]
