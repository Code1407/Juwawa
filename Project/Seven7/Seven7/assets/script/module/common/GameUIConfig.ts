/*
 * @Date: 2021-08-12 09:33:37
 * @LastEditors: dgflash
 * @LastEditTime: 2022-11-11 17:41:53
 */

import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { UIConfig } from "db://oops-framework/core/gui/layer/UIConfig";
import { BundleName } from "../../framework/commom/FrameDefine";


/** 界面唯一标识（方便服务器通过编号数据触发界面打开） */
export enum UIID {
    /** 资源加载界面 */
    Loading = 1,
    /** 确认弹出窗口 */
    Confirm,
    /** 提示弹出窗口 */
    Alert,
    /** Ping */
    Ping,

    /** 排行榜 */
    UI_Rank_Main,
    UI_Rank_Help,
    UI_Rank_Award,

    /** 邮件 */
    UI_Mail_Main,

    Seven7UI_Main,
    Seven7UI_MyBetsHistroy, //我的押注历史
    Seven7UI_Help,          //帮助
    Seven7UI_GameHistory,   //历史转盘结果
    Seven7UI_CurBetResult,  //每次结果
}

/** 打开界面方式的配置数据 */
export var UIConfigData: { [key: number]: UIConfig } = {
    [UIID.Loading]: { layer: LayerType.UI, prefab: "prefab/uiLoading", bundle: BundleName.Resources },
    [UIID.Confirm]: { layer: LayerType.UI, prefab: "resources/prefabs/confirm", bundle: BundleName.Common, mask: true },
    [UIID.Alert]: { layer: LayerType.Dialog, prefab: "resources/prefabs/alert", mask: true },
    [UIID.Ping]: { layer: LayerType.Dialog, prefab: "resources/prefabs/ping", bundle: BundleName.Common },

    [UIID.UI_Rank_Main]: { layer: LayerType.UI, prefab: "resources/prefabs/UI_Rank_Main", bundle: BundleName.Rank },
    [UIID.UI_Rank_Help]: { layer: LayerType.UI, prefab: "resources/prefabs/UI_Rank_Help", bundle: BundleName.Rank },
    [UIID.UI_Rank_Award]: { layer: LayerType.UI, prefab: "resources/prefabs/UI_Rank_Award", bundle: BundleName.Rank },

    [UIID.UI_Mail_Main]: { layer: LayerType.UI, prefab: "resources/prefabs/UI_Mail_Main", bundle: BundleName.Mail },

    [UIID.Seven7UI_Main]: { layer: LayerType.UI, prefab: "resources/prefabs/uiSeven7_main", bundle: BundleName.SkinDefault },
    [UIID.Seven7UI_MyBetsHistroy]: { layer: LayerType.UI, prefab: "resources/prefabs/uiSeven7_myBetsHistroy", bundle: BundleName.SkinDefault },
    [UIID.Seven7UI_Help]: { layer: LayerType.UI, prefab: "resources/prefabs/uiSeven7_help", bundle: BundleName.SkinDefault },
    [UIID.Seven7UI_GameHistory]: { layer: LayerType.UI, prefab: "resources/prefabs/uiSeven7_gameHistory", bundle: BundleName.SkinDefault },
    [UIID.Seven7UI_CurBetResult]: { layer: LayerType.UI, prefab: "resources/prefabs/uiSeven7_cruBetResult", bundle: BundleName.SkinDefault },
}