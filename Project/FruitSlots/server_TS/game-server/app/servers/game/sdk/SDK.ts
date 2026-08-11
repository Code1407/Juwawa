import { Application } from "pinus";
import { ISdk, ISdkConfig } from "./ISdk";
import GameServer from "../GameServer";
import SdkTestLocal from "./test/SdkTest";
import { SdkFinal } from "./SdkFinal";

export default class SDK {
    [gameName: string]: ISdk
    constructor(app: Application, gameServer: GameServer, sdkName: string) {
        const sdkBuilder = new SdkBuilder(this, app, sdkName, gameServer);
        sdkBuilder.build();
    }
}

const iSdks = new Map<string[], [string, any]>([
    [["test"], ["test/test.json", SdkTestLocal]],
]);

class SdkBuilder {
    sdk: SDK;
    app: Application;
    gameServer: GameServer;
    sdkName: string;

    constructor(sdk: SDK, app: Application, sdkName: string, gameServer: GameServer) {
        this.sdk = sdk;
        this.app = app;
        this.gameServer = gameServer;
        this.sdkName = sdkName;
    }

    build() {
        for (let [key, value] of iSdks) {
            if (key.includes(this.sdkName)) {
                const configPath = value[0];
                const sdk = value[1];

                if (configPath && sdk) {
                    this.buildSdk(configPath, sdk);
                }

                break;
            }
        }
    }

    private buildSdk<T extends ISdk>(configPath: string,
        Sdk: new (sdkConfig: ISdkConfig, gameServer: GameServer, gameName: string) => T) {
        let file = "../../../../config/sdk/" + configPath;
        let env = this.app.get("env");
        let config: ISdkConfig = require(file)[env];

        this.gameServer.configFilePath = require('path').join(__dirname, file);
        this.gameServer.sdkConfig = config;

        for (let game in config.gameId) {
            let sdk = new Sdk(config, this.gameServer, game);
            this.sdk[game] = new SdkFinal(sdk, game, this.app, this.sdkName);
        }
    }
    
}

