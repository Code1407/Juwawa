export class ScreenType {
    public static full: string = "full";
    public static half: string = "half";
    public static six: string = "six";
    public static seven: string = "seven";
}

export class PublishType {
    public static browser: string = "browser";
    public static wechat: string = "wechat";
}

export enum GameEnvironment {
    dev = "dev",
    sim = "sim",
    pro = "pro",
}

export class ServerAddress {
    host: string;
    port: number;
}

export class GameConfig {
    gameId: string;
    gameName: string;
    gameCoinIcon: string;
    betGradeAmounts: Array<number> = null;
    chipUrls: Map<string, string> = null;
    publishType: PublishType;
    extra: any;
}

export class RankConfig {
    enable: boolean;
    platform: string;
    url: string;
}

export class ActivityConfig {
    enable: boolean;
    iconUrl: string;
    url: string;
}

export class BranchConfig {
    url: Map<GameEnvironment, string> = null;
}

export class AppConfig {
    appId: string;
    appName: string;
    servers: Map<GameEnvironment, ServerAddress> = null;
    appCoinIcon: string;
    enableRank: boolean;
    rankUrls: Map<GameEnvironment, string> = null;
    rank: Map<GameEnvironment, RankConfig> = null;
    activity: Map<GameEnvironment, ActivityConfig> = null;
    branch: {
        globalViews: BranchConfig;
        rank: BranchConfig;
    }
    // {"gameName": {GameConfig}}
    games: Map<string, GameConfig> = null;
    extra: any;
}

export class SdkConfig {
    debug: string[] = null;
    sdkId: string;
    sdkName: string;
    sdkLibUrl: string;
    apps: Map<string, AppConfig> = null;
}

export class AdaptedConfig {
    servers: Map<string, ServerAddress> = null;
    host: string;
    port: number;
    sdkId: string;
    sdkName: string;
    sdkLibUrl: string;
    sdkExports: any;
    appId: string;
    appName: string;
    gameId: string;
    gameName: string;
    gameCoinIcon: string;
    gameCoin: cc.SpriteFrame = null;
    enableRank: boolean;
    rankUrl: string;
    rank: RankConfig;
    activity: ActivityConfig;
    branch: {
        globalViews: string;
        rank: string;
    }
    betGradeAmounts: Array<number> = null;
    chipUrls: Map<string, string> = null;
    chips: Map<string, cc.SpriteFrame> = null;
    appExtra: any = null;
    gameExtra: any = null;

    setGameCoin = (...sprites: cc.Sprite[]) => {
        if (this.gameCoin && sprites && sprites.length > 0) {
            sprites.forEach(sprite => {
                if (sprite) sprite.spriteFrame = this.gameCoin
            });
        }
    }
}
