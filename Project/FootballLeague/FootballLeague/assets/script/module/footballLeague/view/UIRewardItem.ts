import { _decorator, Asset, Node, Label, Sprite, find, SpriteFrame, isValid, Color } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { TableZhuanPan } from '../../../table/TableZhuanPan';
import { Utils } from '../../../framework/utils/Utils';
import GameModelMgr from '../../mvc/GameModelMgr';
import { oops } from 'db://oops-framework/core/Oops';
const { ccclass, property } = _decorator;

@ccclass('UIRewardItem')
export class UIRewardItem extends GameComponent {
    private static teamFrameCache: Map<string, { frame: SpriteFrame, texture: Asset }> = new Map();
    private static teamFrameLoading: Map<string, Promise<SpriteFrame>> = new Map();

    @property(Label)
    lb_mult: Label;
    @property(Label)
    lb_bet: Label;
    @property(Sprite)
    icon: Sprite;
    @property(Sprite)
    icon_coins: Sprite;
    @property(Node)
    nod_select: Node;
    @property(Node)
    nod_finger: Node;
    @property(Node)
    nod_myBet: Node;

    @property({type: Node, displayName: '热度节点'})
    nod_hot: Node;
   
    @property(Node)
    nod_hot_max: Node;

    private clickFunc: Function = null;
    private _rewardID: number = 0;
    private _zhuanpanId: number = 0;
    private _iconRequestId: number = 0;

    //如果自己下注了，lb_bet 修改RGB为 FFEA00
    private FontColor: number = 0xFFEA00;
    private DefaultFontColor: number = 0xFFFFFFFF;

    onLoad(): void {
        let btn = find("item", this.node);
        btn.on(Node.EventType.TOUCH_START, this.onClickBtn.bind(this))

        this.clear_hot();
    }

    init(cfgZhuanpan: TableZhuanPan, func: Function) {
        let zhuanpanId = cfgZhuanpan.ID
        this._zhuanpanId = zhuanpanId;
        this.clickFunc = func;
        this._rewardID = cfgZhuanpan.Rewards[0];

        this.refresh_multiple_label();
        this.setTeamSprite(`PlistImage/TeamImage1/qd_${zhuanpanId}`);  //设置球队队标
    }


    //设置球队队标
    setTeamInfo(index: number) {
        this.refresh_multiple_label();
        this.setTeamSprite(`PlistImage/TeamImage${index + 1}/qd_${this._zhuanpanId}`);

        this.clear_bet_info();
        this.update_bet_info(
            GameModelMgr.footballLeagueModel.get_all_bet_value(this._rewardID),
            GameModelMgr.footballLeagueModel.get_bet_value(this._rewardID) > 0
        );
    }

    //更新每一个下注额度
    get_reward_id() {
        return this._rewardID;
    }

    private refresh_multiple_label() {
        let multiple = GameModelMgr.footballLeagueModel.get_reward_multiple(this._zhuanpanId);
        this.lb_mult.string = (multiple || 0) + "x";
    }

    update_bet_info(betNum: number, hasSelfBet: boolean = false) {
        if (betNum <= 0) {
            return;
        }
        this.set_bet_label_color(hasSelfBet ? this.FontColor : this.DefaultFontColor);
        if (betNum > 9999) {
            this.lb_bet.string = Utils.simplifyNumber(betNum)
        } else {
            this.lb_bet.string = betNum.toString();
        }
        if (!this.nod_myBet.active) {
            this.nod_myBet.active = true;
        }
    }

    show_conis_icon(coinsSp: SpriteFrame) {
        if (coinsSp) {
            //this.icon_coins.spriteFrame = coinsSp;
        }
    }


    //刷新热度
    show_hot(betValue: number) {
        let hotLevel = this.get_hot_level(betValue);
        this.set_hot_level(hotLevel);
    }

    clear_hot() {
        this.set_hot_level(0);
    }

    private set_hot_level(hotLevel: number) {
        if (!this.nod_hot) {
            return;
        }
        const h1 = this.nod_hot.getChildByName("h1");
        const h2 = this.nod_hot.getChildByName("h2");
        const h3 = this.nod_hot.getChildByName("h3");
        if (h1) {
            h1.active = hotLevel >= 1;
        }
        if (h2) {
            h2.active = hotLevel >= 2;
        }
        if (h3) {
            h3.active = hotLevel >= 3;
        }

        if (this.nod_hot_max) {
            //this.nod_hot_max.active = hotLevel >= 3;
        }
    }

    private get_hot_level(betValue: number): number {
        betValue = Number(betValue) || 0;
        if (betValue >= 5000) {
            return 3;
        }
        if (betValue >= 2000) {
            return 2;
        }
        if (betValue >= 1000) {
            return 1;
        }
        return 0;
    }

    clear_bet_info() {
        this.lb_bet.string = "";
        this.set_bet_label_color(this.DefaultFontColor);
        this.nod_myBet.active = false;
    }

    private set_bet_label_color(color: number) {
        // FontColor 使用 RRGGBB，DefaultFontColor 使用 RRGGBBAA；两种写法都支持。
        if (color <= 0xFFFFFF) {
            this.lb_bet.color = new Color(
                (color >>> 16) & 0xFF,
                (color >>> 8) & 0xFF,
                color & 0xFF,
                0xFF
            );
            return;
        }
        this.lb_bet.color = new Color(
            (color >>> 24) & 0xFF,
            (color >>> 16) & 0xFF,
            (color >>> 8) & 0xFF,
            color & 0xFF
        );
    }

    private onClickBtn() {
        if (this._rewardID > 0 && this.clickFunc && typeof this.clickFunc === 'function') {
            //let pos = this.node.getWorldPosition();
            //new Vec3(pos.x, pos.y - 50, 0)
            this.clickFunc(this._rewardID);
        }
    }

    private async setTeamSprite(path: string) {
        const requestId = ++this._iconRequestId;
        const spriteFrame = await UIRewardItem.getTeamFrame(path);
        if (
            requestId !== this._iconRequestId ||
            !spriteFrame ||
            !isValid(this.node) ||
            !this.icon ||
            !isValid(this.icon)
        ) {
            return;
        }

        this.icon.spriteFrame = spriteFrame;
    }

    private static async getTeamFrame(path: string): Promise<SpriteFrame> {
        const cached = UIRewardItem.teamFrameCache.get(path);
        if (cached && cached.frame && isValid(cached.frame)) {
            return cached.frame;
        }

        let loading = UIRewardItem.teamFrameLoading.get(path);
        if (!loading) {
            loading = UIRewardItem.loadTeamFrame(path);
            UIRewardItem.teamFrameLoading.set(path, loading);
        }
        return loading;
    }

    private static async loadTeamFrame(path: string): Promise<SpriteFrame> {
        let spriteFrame: SpriteFrame = null;
        try {
            spriteFrame = await oops.res.loadAsync(BundleName.SkinDefault, path, SpriteFrame);
            if (!spriteFrame) {
                spriteFrame = await oops.res.loadAsync(BundleName.SkinDefault, `resources/${path}`, SpriteFrame);
            }
        } catch (error) {
            console.error(`UIRewardItem load sprite error: ${path}`, error);
        }

        UIRewardItem.teamFrameLoading.delete(path);
        if (!spriteFrame) {
            console.error(`UIRewardItem load sprite failed: ${path}`);
            return null;
        }

        const texture = UIRewardItem.getSpriteFrameTexture(spriteFrame);
        spriteFrame.addRef();
        if (texture && isValid(texture)) {
            texture.addRef();
        }
        UIRewardItem.teamFrameCache.set(path, { frame: spriteFrame, texture });
        return spriteFrame;
    }

    private static getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }

    protected onDestroy(): void {
        this._iconRequestId++;
        if (this.icon && isValid(this.icon)) {
            this.icon.spriteFrame = null;
        }
        super.onDestroy();
    }
}


