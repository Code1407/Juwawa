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
}

/** 打开界面方式的配置数据 */
export var UIConfigData: { [key: number]: UIConfig } = {
    [UIID.Loading]: { layer: LayerType.UI, prefab: "prefab/uiLoading", bundle: BundleName.Resources },
    [UIID.Confirm]: { layer: LayerType.UI, prefab: "resources/prefabs/confirm", bundle: BundleName.Common, mask: true },
    [UIID.Alert]: { layer: LayerType.Dialog, prefab: "resources/prefabs/alert", mask: true },
    [UIID.Ping]: { layer: LayerType.Dialog, prefab: "resources/prefabs/ping", bundle: BundleName.Common },

    //[UIID.Seven7UI_Main]: { layer: LayerType.UI, prefab: "prefabs/uiSeven7_main" },
}