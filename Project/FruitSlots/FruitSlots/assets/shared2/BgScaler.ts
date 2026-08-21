// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { onBgScaler } from "../shared/Common";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BgScaler extends cc.Component {

    preSize: cc.Size = cc.size(0, 0);

    curSize: cc.Size = cc.size(0, 0);

    @property()
    fitVisibleSizeInPixel = false;

    callback

    protected start(): void {
        (<any>window).showbghide1=()=>{
            if((<any>window).serverConfig.platId>=2000&&(<any>window).serverConfig.platId<3000){
                this.node.opacity=0
            }
        }
        let realDR = this.fitVisibleSizeInPixel ? cc.view.getVisibleSizeInPixel() : cc.size(this.node.parent.width, this.node.parent.height);
        this.preSize.width = realDR.width;
        this.preSize.height = realDR.height;
        onBgScaler(this.node, false);
        this.callback = () => onBgScaler(this.node);
        (<any>window).onGameScreenChanged.push(this.callback);
        let tw = cc.tween(this.node).repeatForever(cc.tween().delay(0).call(() => onBgScaler(this.node, false))).start();
        setTimeout(() => {
            tw.stop();
        }, 1000);
        (<any>window).showBgHide=()=>{
            this.node.opacity=255
            this.node.active=(<any>window).showonGameBgHide
        }
    }

    protected onDestroy(): void {
        let events: (() => void)[] = (<any>window).onGameScreenChanged;
        events.splice(events.indexOf(this.callback), 1);
    }
}