// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { getLang } from "../../lang/afterLoad";
import { sdk, toThousands } from "../../shared/Common";
import { ELang } from "../../shared3/langEnum_shared3";
import Audio from "../Audio";
import Game from "../Game";
import { gGameData } from "../GameData";
import ImageCache from "../image/ImageCache";
import { IRankListItem } from "../interface/ILuxuryCar"

const { ccclass, property } = cc._decorator;

@ccclass
export default class PoppusViewUI extends cc.Component {

    @property(cc.Node)
    exit: cc.Node = null;

    @property(cc.Node)
    setting: cc.Node = null;

    @property(cc.Sprite)
    soundSprite: cc.Sprite = null;

    @property(cc.Node)
    rule: cc.Node = null;

    @property(cc.Node)
    rankList: cc.Node = null;

    @property(cc.Node)
    myHistory: cc.Node = null;

    @property(cc.Node)
    settingView: cc.Node = null;

    @property(cc.Node)
    ruleView: cc.Node = null;

    @property(cc.Node)
    ruleLabelNode: cc.Node = null;

    @property(cc.Node)
    No_Node: cc.Node[] = [];

    @property(cc.Node)
    rankListView: cc.Node = null;

    @property(cc.Node)
    myHistoryView: cc.Node = null;

    @property(cc.Node)
    exceedView: cc.Node = null;

    @property(cc.Label)
    rankListNo1Name: cc.Label = null;

    @property(cc.Label)
    rankListNo1Revenue: cc.Label = null;

    @property(cc.Sprite)
    rankListNo1Profile: cc.Sprite = null;


    //充值按钮
    @property(cc.Node)
    Play_btn:cc.Node = null

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    setRankListNo1Value(rankListItem: IRankListItem) {
        // this.rankListNo1Name.string = decodeURI(rankListItem.name);
        // this.rankListNo1Revenue.string = toThousands(rankListItem.revenue);

        let url = rankListItem.profile;
        if (url == null) return;
        cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
            if (error) return;
            var frame = new cc.SpriteFrame(texture);
            //this.rankListNo1Profile.spriteFrame.destroy();
            this.rankListNo1Profile.spriteFrame = frame;
        });
    }

    switchLang() {
        const isAr = getLang()===ELang.ar;

        // console.log("isAr========="+isAr,"////Lang====="+getLang());
        
        /* ---- 1. ruleLabelNode 尺寸、位置 ---- */
        const trs = this.ruleLabelNode;
        trs.width = isAr ? 720 : 770;   // 770

        /* ---- 2. RichText 组件参数 ---- */
        const rt = this.ruleLabelNode.getComponent(cc.Label);
        rt.horizontalAlign=isAr?cc.Label.HorizontalAlign.RIGHT:cc.Label.HorizontalAlign.LEFT;

        /* ---- 3. No_Node 子节点显隐 ---- */
        if (isAr == true) {
            for (let i = 0; i < this.No_Node.length; i++) {
                this.No_Node[i].active=true;
            }
        } else {
            for (let i = 0; i < this.No_Node.length; i++) {
                this.No_Node[i].active=false;
            }
        }
    }
    
    start() {
        this.exit.on(cc.Node.EventType.TOUCH_START, () => {
            sdk.quit();
        });
        let __this = this;
        this.setting.on(cc.Node.EventType.TOUCH_START, () => {
            //__this.settingView.active = true;
            __this.setting.scaleX = this.setting.scaleY = 1.2;
        });
        this.rule.on(cc.Node.EventType.TOUCH_START, () => {
            __this.ruleView.active = true;
            __this.rule.scaleX = this.rule.scaleY = 1.2;
        });
        this.rankList.on(cc.Node.EventType.TOUCH_START, () => {
            //__this.rankListView.active = true;   //不显示游戏自身排行榜
        });
        this.myHistory.on(cc.Node.EventType.TOUCH_START, () => {
            __this.myHistoryView.active = true;
        });

        this.setting.on(cc.Node.EventType.TOUCH_END, () => {
            __this.setting.scaleX = this.setting.scaleY = 1;
            Audio.Instance.audioOn = !Audio.Instance.audioOn;
            gGameData.soundVol = Audio.Instance.audioOn ? 1 : 0;
            if (!Audio.Instance.audioOn) {
                Audio.Instance.stopAllSounds();
            }
            else {
                Audio.Instance.resumeAllSounds();
            }
            let playerSettings = {
                soundVol: gGameData.soundVol,
                lastBetAmountButton: gGameData.betAmountIndex
            }
            Game.Instance.player.updateSettings(playerSettings);
        });
        this.rule.on(cc.Node.EventType.TOUCH_END, () => {
            __this.rule.scaleX = this.rule.scaleY = 1;
        });

        this.setting.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.setting.scaleX = this.setting.scaleY = 1;
        });
        this.rule.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.rule.scaleX = this.rule.scaleY = 1;
        });


        this.Play_btn.on(cc.Node.EventType.TOUCH_END, () => {
            sdk.recharge()  //拉起充值
        });

        

    }

    // update (dt) {}
}

/* rule 说明，不要删这断注释：
1. Choose your bet amount and select the food to bet;
2. There're 30 seconds for betting each round, the result willbe announced instantly afterwards;
3. If the result announced matches the food you haveselected, you will coin rewards relative to the respectiveodds;
4. The official prize pool will increase as more usersparticipate in game, there will be a chance for "PIZZA" or "SALAD" reward as prize pool reaches a certain amount;
5. If "SALAD" was announced, then all vegetables will berewarded;
6. lf "PIZZA" was announced, then all meats will be rewarded.
*/
