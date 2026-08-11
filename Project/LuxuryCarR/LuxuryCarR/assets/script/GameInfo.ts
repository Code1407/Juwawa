import { gConst } from "./interface/ILuxuryCarR";

(<any>window).gameVersion = "v1.1.0.1";
(<any>window).gameName = gConst.gameName;
if (cc.sys.platform == cc.sys.WECHAT_GAME)
    (<any>window).gameId = "1805890925336707074";
