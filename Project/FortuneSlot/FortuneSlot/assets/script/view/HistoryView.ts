// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ELang } from "../../lang/langEnum";
import Audio from "../Audio";
import { IHistoryItem } from "../interface/IFruitSlots";
import HistoryViewItem from "./Item/HistoryViewItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HistoryView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    bg: cc.Node = null;

    @property(cc.Prefab)
    historyItem:cc.Prefab = null;

    @property(cc.Node)
    content:cc.Node = null;

    history:IHistoryItem[] = [];
    heights:number[] = [];
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
            Audio.Instance.playClick();
        });

        this.bg.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
            Audio.Instance.playClick();
        });
    }

    protected onEnable(): void {
        this.heights = [150,150,200,250,350,430]
        let layout = this.content ? this.content.getComponent(cc.Layout) : null;
        if (layout) {
            layout.enabled = false;
        }
        this.content.removeAllChildren();
        if(!this.history) return;
        let changeAlign = false;
        let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
        if (lang && lang.length > 2) lang = lang.substring(0, 2);
        if (![ELang.ar, ELang.en, ELang.id, ELang.tr, ELang.ur].includes(lang as ELang)) lang = ELang.en;
        if ([ELang.ar, ELang.ur].includes(lang as ELang)) changeAlign = true;
        for(let i = 0; i < this.history.length; i++){
            let historyItem = cc.instantiate(this.historyItem);
            historyItem.parent = this.content;
            historyItem.getComponent(HistoryViewItem).setValue(this.history[i], changeAlign);
            historyItem.height = this.heights[this.history[i].lines.length] || this.heights[0];
        }
        this.scheduleOnce(() => {
            if (layout && layout.isValid) {
                layout.enabled = true;
                layout.updateLayout();
            }
            let scrollView = this.content?.parent?.parent?.getComponent(cc.ScrollView);
            if (scrollView && scrollView.isValid) {
                scrollView.stopAutoScroll();
                scrollView.scrollToTop(0);
            }
        }, 0);
    }

    protected onDisable(): void {
        let layout = this.content ? this.content.getComponent(cc.Layout) : null;
        if (layout && layout.isValid && !layout.enabled) {
            layout.enabled = true;
        }
    }

    // update (dt) {}
}
