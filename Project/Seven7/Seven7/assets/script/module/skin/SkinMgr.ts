import { _decorator, sys, director } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { TableSkin } from '../../table/TableSkin';
import { ESkin } from '../../framework/commom/FrameDefine';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';

class SkinMgr {
    private static instance = null;
    constructor() {
        if (SkinMgr.instance) {
            return SkinMgr.instance;
        }
        SkinMgr.instance = this;
    }

    //当前皮肤
    private _curSkin: ESkin = ESkin.default;
    public get curSkin(): ESkin {
        return this._curSkin;
    }
    public set curSkin(v: ESkin) {
        this._preSkin = this._curSkin;
        this._curSkin = v;
    }

    //上一个皮肤
    private _preSkin: ESkin = ESkin.default;
    public get preSkin(): ESkin {
        return this._preSkin;
    }

    /**
     * 切换皮肤(有更换皮肤预制体的需要重新加载游戏,若只是图片则不需要)
     * @param newSkinType 新皮肤类型
     * @param reloadGame  是否重新加载游戏
     */
    changeSkin(newSkinType: ESkin, reloadGame: boolean = false) {
        if (newSkinType == this.curSkin) {
            console.error("Current SkinType is: %s", newSkinType);
            return;
        }
        this.curSkin = newSkinType;
        if (reloadGame) {
            if (sys.isBrowser) {
                window.location.reload();
            } else {
                director.loadScene(director.getScene().name);
            }
            return;
        }
        oops.message.dispatchEvent(EventMessage.GAME_SKIN_UPDATE);
    }


    /**
    * 通过皮肤类型获取Bundle Name
    * @param skinType 皮肤类型
    */
    getBundleNameBySkin(skinType: number = this.curSkin) {
        let cfgSkin: TableSkin = new TableSkin();
        cfgSkin.init(skinType);
        if (!cfgSkin.BundleName || cfgSkin.BundleName === undefined || cfgSkin.BundleName.trim() === "") {
            console.error("getBundleNameBySkin error, skinType:%s", skinType)
            return;
        }
        return cfgSkin.BundleName;
    }

    /**
    * 获取皮肤Bundle Name,没有就读取默认bundle
    */
    geSkinBundleName() {
        let bundleName = this.getBundleNameBySkin();
        if (!bundleName) {
            bundleName = this.getBundleNameBySkin(ESkin.default);
        }
        return bundleName;
    }

    /**
    * 判断当前皮肤是不是默认皮肤
    */
    checkSkinIsDefault() {
        return this.curSkin == ESkin.default;
    }
}

export default new SkinMgr();


