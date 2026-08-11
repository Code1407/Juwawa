import { DataSource } from "typeorm"
import { Ludo_round } from '../entity/LudoEntity';
import { Application } from "pinus";

export default class Mysql {
    private config = require("../../../../../config/database/mysql.json");
    private mysql: DataSource;

    constructor(private app: Application, sdkName: string) {
        this.init(app, sdkName);
    }

    init(app: Application, sdkName: string) {
        return;  // 记账需要打开这句
        let env: string = app.get("env");
        let config = this.config[env];
        let database = sdkName;
        this.mysql = new DataSource({
            type: "mysql",
            host: config.host,
            port: config.port,
            username: config.user,
            password: config.password,
            database: database,
            logging: false,
            entities: [Ludo_round],
            migrations: [],
            subscribers: [],
        });
    }

    async insertRound<T>(item: T) {
        return;  // 记账需要打开这句
        try {
            return this.mysql.manager.save<T>(item);
        } catch(e) {
            console.log("insertRound", e.toString());
        }
    }
    async ready(): Promise<boolean> {
        return true;   // 记账需要打开这句
        try {
            await this.mysql.initialize();
        } catch(e) {
            console.log("ready", e.toString());
        }
        return true;
    }

    async insert<T>(item: T) {
        
    }

    async insertMuti<T>(items: T[]) {
    }

    async insertMutiExt(...args: any[][]) {
    }
}
