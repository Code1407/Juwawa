/**
 * 游戏全局元信息初始化（副作用脚本，请勿删除）
 *
 * 说明：
 * 1. 本文件不挂载到任何节点（无 .meta），而是被 PureClient.min.js 通过 require 引入，
 *    在库初始化时执行一次，把 3 个全局变量挂到 window 上。
 * 2. 这些变量被配置层（ConfigAssist.ts）和资源加载层广泛使用：
 *    - gameVersion：作为 URL 查询参数（?v=xxx）防止浏览器/CDN 缓存旧版本资源；
 *      同时用于 sdkConfig.debug 按版本开关调试打印。
 *    - gameName：上报/日志中标识游戏名称。
 *    - gameId：服务端协议中标识游戏 ID。
 * 3. 若删除本文件，window.gameVersion 将变 undefined，导致配置/图标 URL 变成
 *    xxx?v=undefined，防缓存机制失效，发版后用户可能加载到旧资源。
 * 4. 发版时只需更新下面的 gameVersion 字符串即可。
 */
import { ELang } from "../lang/langEnum";
import { langContent } from "../lang/node";

// 游戏版本号：用于资源 URL 防缓存（?v=xxx）和调试开关判断
(<any>window).gameVersion = "v1.1.0.1";
// 游戏名称：标识当前游戏
(<any>window).gameName = "FruitSlots";
// 游戏 ID：服务端协议中使用的游戏标识
(<any>window).gameId = "1765373900355977217";


// 若开启了版本号展示开关，延迟 10ms 把版本号追加到所有语言的「帮助」文案末尾
setTimeout(() => {
    if ((<any>window).showGameVersion) {
        for (let e in ELang) {
            if (langContent[e] != null)
                langContent[e].help.content += `\n${(<any>window).gameVersion}`;
        }
    }
}, 10);