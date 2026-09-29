import { DynamicAtlasManager, _decorator, macro } from 'cc';
import { oops } from '../../extensions/oops-plugin-framework/assets/core/Oops';
import { Root } from '../../extensions/oops-plugin-framework/assets/core/Root';
import GameProxyMgr from "./module/mvc/GameProxyMgr";
import GameSystemMgr from "./module/mvc/GameSystemMgr";
import GameModelMgr from "./module/mvc/GameModelMgr";
import LoadingResMgr from './module/common/LoadingResMgr';
import { UIID, UIConfigData } from './module/common/GameUIConfig';

const { ccclass, property } = _decorator;

macro.CLEANUP_IMAGE_CACHE = false;
DynamicAtlasManager.instance.enabled = true;
DynamicAtlasManager.instance.maxFrameSize = 512;

@ccclass('GameRoot')
export class GameRoot extends Root {

    protected async initGui() {
        oops.gui.init(UIConfigData);
        await oops.gui.openAsync(UIID.Loading);
        await oops.network.initSdk();
        LoadingResMgr.init(this.initMgr);
    }

    private async initMgr() {
        // 初始化网络模块
        await oops.network.initNet();
        // 初始化Proxy
        GameProxyMgr.initProxy();
        // 初始化System
        GameSystemMgr.initSystem();
        // 初始化Moudel
        GameModelMgr.initModule();
        // 连接网络
        oops.network.connect();
    }

    protected clearMgr() {
        super.clearMgr();
        GameProxyMgr.clearProxy();
        GameSystemMgr.clearSystem();
        GameModelMgr.clearModule();
    }
}