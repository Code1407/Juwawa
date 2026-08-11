/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-02 11:03:08
 */

/**
 * 全局事件监听方法
 * @param event      事件名
 * @param args       事件参数
 */
export type ListenerFunc = (event: string, ...args: any) => void

/** 框架内部全局事件  */
export enum EventMessage {
    /** 游戏从后台进入事件 */
    GAME_SHOW = "GAME_ENTER",
    /** 游戏切到后台事件 */
    GAME_HIDE = "GAME_EXIT",
    /** 游戏画笔尺寸变化事件 */
    GAME_RESIZE = "GAME_RESIZE",
    /** 游戏全屏事件 */
    GAME_FULL_SCREEN = "GAME_FULL_SCREEN",
    /** 游戏旋转屏幕事件 */
    GAME_ORIENTATION = "GAME_ORIENTATION",

    /** 网络断开链接 */
    GAME_NET_DISCONNECT = "MSG_NET_DISCONNECT",
    /** 网络链接 */
    GAME_NET_CONNECT = "MSG_NET_CONNECT",
    /** 加载进度 */
    GAME_LOAD_STEP = "MSG_LOAD_STEP",
    /** ping */
    GAME_PING = "MSG_PING",
    /** 同步服务器时间 */
    GAME_SYNC_SERVER_TIME = "GAME_SYNC_SERVER_TIME",
    /** 玩家积分改变(服务器回调主动推) */
    GAME_COINS_CHANGE_PUSH = "MSG_COINS_CHANGE_PUSH",
    /** 玩家基本信息改变*/
    GAME_PLAYER_BASE_DATA_UPDATE = "MSG_PLAYER_BASE_DATA_UPDATE",
    /**皮肤变化*/
    GAME_SKIN_UPDATE = "MSG_SKIN_UPDATE",
}
