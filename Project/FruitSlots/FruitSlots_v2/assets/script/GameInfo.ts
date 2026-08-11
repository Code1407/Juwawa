import { ELang } from "../lang/langEnum";
import { langContent } from "../lang/node";

(<any>window).gameVersion = "v1.1.0.1";
(<any>window).gameName = "FruitSlots";
(<any>window).gameId = "1765373900355977217";

/** 
 * 游戏版本概要，从1.0.8开始记录
 * 
 * 1.0.8: 
 *   1）修正了多语言翻译
 *   2）将window.location.reload封装到sdk中，替换为sdk.reload，以适应有些客户sdk需要定制刷新机制（如：layla）
 * 
 * 1.0.9: 
 *   1）增加了从sud sdk中获取房间号功能
 * 
 * 1.1.0.1: 
 *   1）预制体分包改造
 */

setTimeout(() => {
    if ((<any>window).showGameVersion) {
        for (let e in ELang) {
            if (langContent[e] != null)
                langContent[e].help.content += `\n${(<any>window).gameVersion}`;
        }
    }
}, 10);