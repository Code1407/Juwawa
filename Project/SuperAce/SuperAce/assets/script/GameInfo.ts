import { gConst } from "./interface/ISuperAce";

(<any>window).gameVersion = "v1.0.8";
(<any>window).gameName = gConst.gameName;

/** 
 * 游戏版本概要，从1.0.8开始记录
 * 
 * 1.0.8: 
 *   1）修正了多语言翻译
 *   2）将window.location.reload封装到sdk中，替换为sdk.reload，以适应有些客户sdk需要定制刷新机制（如：layla）
 */
