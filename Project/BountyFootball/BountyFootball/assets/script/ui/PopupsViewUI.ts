// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import { sdk } from "../../shared/Common";
import Audio from "../Audio";
import Game from "../Game";
import { gGameData } from "../GameData";
import ImageCache from "../image/ImageCache";
import { IAccount, IRankListItem } from "../interface/IBountyFootball"

const { ccclass, property } = cc._decorator;

@ccclass
export default class PoppusViewUI extends cc.Component {

    @property(cc.Node)
    exit: cc.Node = null;

    @property(cc.Node)
    setting: cc.Node = null;

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
    rankListView: cc.Node = null;

    @property(cc.Node)
    myHistoryView: cc.Node = null;

    @property(cc.Node)
    rechargeView: cc.Node = null;

    @property(cc.Label)
    rankListNo1Name: cc.Label = null;

    @property(cc.Label)
    rankListNo1Revenue: cc.Label = null;

    @property(cc.Sprite)
    rankListNo1Profile: cc.Sprite = null;

    // @property(cc.Label)
    // userName: cc.Label = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    setRankListNo1Value(rankListItem: IRankListItem) {
        // this.rankListNo1Name.string = decodeURI(rankListItem.name);
        // this.rankListNo1Revenue.string = toThousands(rankListItem.revenue);

        // let url = rankListItem.profile;
        // if (url == null) return;
        // cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
        //     if (error) return;
        //     var frame = new cc.SpriteFrame(texture);
        //     //this.rankListNo1Profile.spriteFrame.destroy();
        //     this.rankListNo1Profile.spriteFrame = frame;
        // });
    }

    // userSet(items:any){     //设置用户头像和名字
    //     this.userName.string = items.nickname;

    //     let url = items.avatar;
    //     if (url == null) return;
    //     cc.loader.load({ url: decodeURI(decodeURI(url)), type: 'image' }, (error, texture) => {
    //         if (error) return;
    //         var frame = new cc.SpriteFrame(texture);
    //         //this.rankListNo1Profile.spriteFrame.destroy();
    //         this.rankListNo1Profile.spriteFrame = frame;
    //     });
    // }
    start() {
        let __this = this;
        this.exit.on(cc.Node.EventType.TOUCH_START, () => {
            // sdk.quit();
            __this.exit.scaleX = this.exit.scaleY = 1.2;
        });
        this.setting.on(cc.Node.EventType.TOUCH_START, () => {
            //__this.settingView.active = true;
            __this.setting.scaleX = this.setting.scaleY = 1.2;
        });
        this.rechargeView.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playshow_result();
            __this.rechargeView.scaleX = this.rechargeView.scaleY = 1.4;
        });
        this.rule.on(cc.Node.EventType.TOUCH_START, () => {
            __this.ruleView.active = true;
            Audio.Instance.playshow_result();
            __this.rule.scaleX = this.rule.scaleY = 1.2;
        });
        this.rankList.on(cc.Node.EventType.TOUCH_START, () => {
            // __this.rankListView.active = true;
        });
        this.myHistory.on(cc.Node.EventType.TOUCH_START, () => {
            __this.myHistoryView.active = true;
            Audio.Instance.playshow_result();
            __this.myHistory.scaleX = this.myHistory.scaleY = 1.2;

        });

        this.setting.on(cc.Node.EventType.TOUCH_END, () => {
            __this.setting.scaleX = this.setting.scaleY = 1;
            Audio.Instance.audioOn = !Audio.Instance.audioOn;
            if (!Audio.Instance.audioOn) {
                Audio.Instance.stopAllSounds();
            }
            else {
                Audio.Instance.playbgm();
            }
            cc.find("tb_sy", this.setting).getComponent(cc.Sprite).spriteFrame = Audio.Instance.audioOn ? ImageCache.Instance.soundSprite[0] : ImageCache.Instance.soundSprite[1];
            gGameData.soundVol = Audio.Instance.audioOn ? 1 : 0;
            let playerSettings = {
                lastBetAmountButton: gGameData.betAmountIndex,
                soundVol: gGameData.soundVol
            }
            Game.Instance.player.updateSettings(playerSettings);
        });
        this.rule.on(cc.Node.EventType.TOUCH_END, () => {
            __this.rule.scaleX = this.rule.scaleY = 1;
        });
        this.exit.on(cc.Node.EventType.TOUCH_END, () => {
            __this.exit.scaleX = this.exit.scaleY = 1;
        });
        this.rechargeView.on(cc.Node.EventType.TOUCH_END, () => {
            __this.rechargeView.scaleX = this.rechargeView.scaleY = 1.2;
        });
        this.myHistory.on(cc.Node.EventType.TOUCH_END, () => {
            __this.myHistory.scaleX = this.myHistory.scaleY = 1;
        });

        this.setting.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.setting.scaleX = this.setting.scaleY = 1;
        });
        this.rule.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            __this.rule.scaleX = this.rule.scaleY = 1;
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
