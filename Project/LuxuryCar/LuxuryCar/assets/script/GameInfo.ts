import { gConst } from "./interface/ILuxuryCar";
import { ELang } from "../shared3/langEnum_shared3";
import { langContent } from "../lang/node";

(<any>window).gameVersion = "v1.1.0.1";
(<any>window).gameName = gConst.gameName;

setTimeout(() => {
    if ((<any>window).showGameVersion) {
        for (let e in ELang) {
            if (langContent[e] != null)
                langContent[e].help.content += `\n${(<any>window).gameVersion}`;
        }
    }
}, 10);