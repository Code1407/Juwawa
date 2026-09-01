// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import Game from "../Game";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ColorEffect extends cc.Component {

    @property(cc.Integer)
    wheelIndex: number = 0;
    @property(cc.Integer)
    resutlIndex: number = 0;
    @property(cc.Node)
    bg1: cc.Node = null;
    @property(cc.Node)
    bg2: cc.Node = null;

    originalColor: cc.Color;
    isDark: boolean = false;
    isEnd: boolean = false;
    isSelect: boolean = false;

    protected init() {
        this.originalColor = this.node.color;
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            let colorEffect = child.getComponent(ColorEffect)
            if (colorEffect == null) {
                colorEffect = child.addComponent(ColorEffect);
                colorEffect.init();
            }
        }
    }

    dark() {
        if (this.isDark)
            return;
        this.isDark = true;

        let color = this.node.color;
        color.r = color.r / 2;
        color.g = color.g / 2;
        color.b = color.b / 2;
        this.node.color = color;
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            child.getComponent(ColorEffect).dark();
        }

        //cc.log("dark:" + this.node.name + ":" + this.node.color.toString());
    }

    recover() {
        if (!this.isDark)
            return;
        this.isDark = false;

        this.node.color = this.originalColor.clone();
        for (let i = 0; i < this.node.childrenCount; ++i) {
            let child = this.node.children[i];
            child.getComponent(ColorEffect).recover();
        }

        //cc.log("recover:" + this.node.name + ":" + this.node.color.toString());
    }

    bg2Effect() {
        cc.Tween.stopAllByTarget(this.bg2);
        this.bg2.active = true;
        this.bg2.opacity = 255;
    }

    /**
     * 清理滚动过程中产生的临时高亮和未完成 Tween。
     * 特殊奖项会把 isSelect 设为 true，这类常亮默认保留。
     */
    clearRollingHighlight(force: boolean = false) {
        cc.Tween.stopAllByTarget(this.bg2);
        this.bg2.opacity = 255;
        if (force || !this.isSelect) {
            this.bg2.active = false;
        }
    }

    runEffect(index: number, delayTime: number) {
        this.isEnd = false;
        // if(this.wheelIndex == index){
        //     this.recover();
        //     setTimeout(() => {
        //         this.dark();
        //     }, delayTime);
        // }
        Game.Instance.fruitIndex(index);
        if (this.wheelIndex == index) {
            this.clearRollingHighlight(true);
            this.bg2.active = true;
            cc.tween(this.bg2)
                .delay(delayTime / 1000)
                .to(0.1, { opacity: 0 })
                .call(() => {
                    this.bg2.active = false;
                    this.bg2.opacity = 255;

                })
                .start();
        }
    }

    run2Final(index: number, result: number, isEnd: boolean): boolean {
        this.isEnd = isEnd;
        if (this.isEnd) return this.isEnd;
        Game.Instance.fruitIndex(index);
        if (index == result && this.wheelIndex == index) {
            this.clearRollingHighlight(true);
            this.bg2.active = true;
            // 命中即固化选中状态，不能等闪烁 Tween 完成后再设置。
            // 苹果时刻下一次抽取会在固定时间后开始，并清理上一格的滚动 Tween；
            // 如果此时 isSelect 仍为 false，上一颗已中奖水果的高亮会被误关掉。
            this.isSelect = true;
            cc.tween(this.bg2)
                .sequence(
                    cc.fadeOut(0.2),
                    cc.fadeIn(0.2),
                    cc.fadeOut(0.2),
                    cc.fadeIn(0.2)
                )
                .start();
            this.isEnd = true;
        }
     
        if (this.wheelIndex == result && Game.Instance.bad01 == false && Game.Instance.bad02 == false) {
            Game.Instance.EffRPS.ZJPlay();
        }
        if (this.wheelIndex == index && !this.isEnd) {
            this.clearRollingHighlight(true);
            this.bg2.active = true;
            if (!this.isSelect) {
                cc.tween(this.bg2)
                    .delay(0.2)
                    .to(0.1, { opacity: 0 })
                    .call(() => {
                        this.bg2.opacity = 255;
                        this.bg2.active = false;
                    })
                    .start();
            }
            // setTimeout(() => {
            //     if(!this.isSelect) this.bg2
            // }, 200);
        }
        return this.isEnd;
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.init();
    }

    // start () { }
}
