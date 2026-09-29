// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Bottombar from "../Bottombar";
import Game from "../Game";
import { gBetAmounts, gBetAmountsExtra, gGameData, initBetAmounts } from "../GameData";
import SlotSuperAce from "../Slot_SuperAce";
import Views from "../Views";
import { connectMultiples } from "../interface/ISuperAce";
import BetAmountItemUI from "./BetAmountItemUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AmountSelectorUI extends cc.Component {

    @property(cc.Label)
    betTotal: cc.Label = null;

    @property(cc.Node)
    betAmountBtn: cc.Node = null;

    @property(cc.Node)
    betAmountView: cc.Node = null;

    @property(cc.Prefab)
    betAmountPrefab: cc.Prefab = null;

    @property(cc.RichText)
    ruleContent: cc.RichText = null;

    @property(cc.Label)
    aceMultiple: cc.Label[] = [];

    @property(cc.Label)
    kingMultiple: cc.Label[] = [];

    @property(cc.Label)
    queenMultiple: cc.Label[] = [];

    @property(cc.Label)
    jackMultiple: cc.Label[] = [];

    @property(cc.Label)
    spadesMultiple: cc.Label[] = [];

    @property(cc.Label)
    heartsMultiple: cc.Label[] = [];

    @property(cc.Label)
    diamondsMultiple: cc.Label[] = [];

    @property(cc.Label)
    clubsMultiple: cc.Label[] = [];

    multipleLabels: cc.Label[][] = [];
    static instance: AmountSelectorUI = null;

    static get Instance() {
        if(!this.instance) this.instance = cc.find("Canvas/Bottombar/BetAmountSelector").getComponent(AmountSelectorUI);
        return this.instance
    }

    setBetAmountLabel(totalAmount: number) {
        this.multipleLabels = [this.clubsMultiple, this.diamondsMultiple, this.heartsMultiple, this.spadesMultiple, this.jackMultiple, this.queenMultiple, this.kingMultiple, this.aceMultiple];
        this.betTotal.string = totalAmount.toString(); // totalAmount < 1000 ? totalAmount.toString() : (totalAmount / 1000) + "k";
        this.ruleContent.string = (<any>window).langContent.help.PaytableContent(totalAmount);
        for(let i = 1; i < connectMultiples.length; i++){
            for(let j = 3; j < connectMultiples[i].length; j++){
                this.multipleLabels[i - 1][j - 3].string = (connectMultiples[i][j] * totalAmount).toString();
            }
        }
    }

    set BetAmountIndex(value: number){
        gGameData.betAmountIndex = value;
    }

    // LIFE-CYCLE CALLBACKS:

    start () {
        const __this = this;
        this.betAmountBtn.on(cc.Node.EventType.TOUCH_START, () => {
            Bottombar.Instance.optionsView.active = false;
            if (SlotSuperAce.Instance.isRunning) return; 
            if(SlotSuperAce.Instance.freeMode) return;
            this.betAmountView.active = !this.betAmountView.active;
            Audio.Instance.playClick();
        });
        this.initBetAmountView();
    }

    // MessageRouter 在鉴权/重连后更新 costs；箭头函数确保从 window 调用时 this 仍是当前组件。
    private readonly configRefreshHandler = () => {
        initBetAmounts();
        if (gGameData.betAmountIndex < 0 || gGameData.betAmountIndex >= gBetAmounts.length) {
            gGameData.betAmountIndex = 0;
        }
        this.initBetAmountView();
    };

    onLoad() {
        (<any>window).changedw = this.configRefreshHandler;
    }

    onDestroy() {
        if ((<any>window).changedw === this.configRefreshHandler) {
            delete (<any>window).changedw;
        }
    }

    initBetAmountView(){
        // 首次 AuthGame 的 costs 回调早于 PlayerAccount 创建，默认按普通档位刷新即可。
        const game = Game.Instance;
        let betAmount = game && game.player && game.player.isExtra ? gBetAmountsExtra : gBetAmounts
        this.betAmountView.removeAllChildren();
        for (let i = 0; i < betAmount.length; i++) {
            let item = cc.instantiate(this.betAmountPrefab);
            item.parent = this.betAmountView;
            item.getChildByName("num").getComponent(cc.Label).string = betAmount[i].toString();
            item.getComponent(BetAmountItemUI).betIndex = i;
        }
        this.betAmountView.active = false;
    }

    darkNode(){
        this.node.children[0].color = cc.color(128,128,128);
        this.node.children[0].children[0].color = cc.color(128,128,128);
    }

    lightNode(){
        this.node.children[0].color = cc.color(255,255,255);
        this.node.children[0].children[0].color = cc.color(255,255,255);
    }

    // update (dt) {}
}
