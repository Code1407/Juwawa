import { gameName, pinusRequest, pinusRequestBranch, pinusResp } from "../GlobalModules";
import { ETradeCode, IAwardResp, IHistoryAwardResp, IRedeem, IRedeemResp } from "../interface/IRedeem";
import { GameDelay, WaitTween } from "../utl/CCAsync_EX";
import { RandomInt } from "../utl/function_EX";
import WinUI from "../utl/WinUI_global";
import { RedeemHistoryView } from "./RedeemHistoryView";

let getuid = () => (<any>window).user?.uid;

const { ccclass, property } = cc._decorator;
@ccclass
export class Redeem extends cc.Component implements IRedeem {
    @property(WinUI)
    boxView: WinUI = null;
    @property(RedeemHistoryView)
    redeemHistoryView: RedeemHistoryView = null;
    skFx: sp.Skeleton = null;
    todo: (() => Promise<void>)[] = [];
    protected start(): void {
        this.skFx = this.boxView.getComponentInChildren(sp.Skeleton);
        console.log("Redeem start");
        pinusResp("onUserLogin", this.onUserLogin.bind(this));
        pinusResp("onBetUpdate", this.onBetUpdate.bind(this));
        pinusResp("onOpenAward", this.onOpenAward.bind(this));
        pinusResp("onRedeemEnd", this.onRedeemEnd.bind(this));
        this.LoopTodo();
        window["testOpenAward"] = () => {
            this.onOpenAward({
                code: ETradeCode.success,
                levelIndex: 0,
                award: RandomInt(10, 10000),
            });
        }
    }
    async LoopTodo() {
        while (true) {
            while (this.todo.length > 0)
                await this.todo.shift()?.();
            await GameDelay(this.node, 0.5);
        }
    }
    userLogin(uid: string, gameName: string) {
    }
    tryOpenAward(uid: string, gameName: string) {
    }
    onUserLogin(resp: IRedeemResp) {
        window["RedeemData"] = resp;
    }
    onBetUpdate(resp: IRedeemResp) {
        window["RedeemData"] = resp;
    }
    onOpenAward(resp: IAwardResp) {
        this.todo.push(async () => {
            this.boxView.node.active = true;
            this.boxView.node.scale = 0;
            cc.tween(this.boxView.node).to(0.3, { scale: 1 }, cc.easeBackOut()).start();
            this.skFx.setAnimation(0, Object.keys(this.skFx.skeletonData.skeletonJson.animations)[0], false);
            this.skFx.addAnimation(0, Object.keys(this.skFx.skeletonData.skeletonJson.animations)[1], true);
            this.boxView.winAmount.string = resp.award.toString();
            await GameDelay(this.boxView.node, 3);
            await WaitTween(cc.tween(this.boxView.node).to(0.3, { scale: 0 }, cc.easeCubicActionIn()));
            this.boxView.node.active = false;
            (<any>window).updateBalance?.();
        });
    }
    onRedeemEnd(resp: IHistoryAwardResp) {
        this.todo.push(async () => {
            this.redeemHistoryView.node.active = true;
            this.redeemHistoryView.node.scale = 0;
            cc.tween(this.redeemHistoryView.node).to(0.3, { scale: 1 }, cc.easeBackOut()).start();
            this.redeemHistoryView.DisplayRedeemHistory(resp.historyGet);
            await GameDelay(this.redeemHistoryView.node, 3);
            await WaitTween(cc.tween(this.redeemHistoryView.node).to(0.3, { scale: 0 }, cc.easeCubicActionIn()));
            this.redeemHistoryView.node.active = false;
        });
    }
}

window["RedeemLogin"] = () => {
    pinusRequestBranch("Redeem", "userLogin", { uid: getuid(), gameName: gameName() });
}
window["RedeemOpenAward"] = () => {
    pinusRequestBranch("Redeem", "tryOpenAward", { uid: getuid(), gameName: gameName() });
}