import { Application } from "pinus";
import Mysql from "./db/mysql";
import Redis from "./db/redis";

class GameRedis {
    [game: string] : Redis;

    constructor(app: Application, sdkName: string, games: string[]) {
        for (let prop in Object.keys(games)) {
            let game = games[prop];
            this[game] = new Redis(app, sdkName, game);
        }
    }
}

class GameMysql {
    [game: string] : Mysql;

    constructor(app: Application, sdkName: string, games: string[]) {
        for (let prop in games) {
            let game = games[prop];
            this[game] = new Mysql(app, sdkName);
        }
    }
}

export default class Database {
    redis: GameRedis;
    mysql: GameMysql;

    constructor(app: Application, private sdkName: string, games: string[]) {
        this.redis = new GameRedis(app, sdkName, games);
        this.mysql = new GameMysql(app, sdkName, games);
    }

    async ready() {
        for (let gameName in this.redis) {
            while (true) {
                if (await this.redis[gameName].ready()) break;
                console.log(`${this.sdkName}.redis.${gameName} unready`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        for (let gameName in this.mysql) {
            while (true) {
                if (await this.mysql[gameName].ready()) break;
                console.log(`${this.sdkName}.mysql.${gameName} unready`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
}