import { _decorator, Node, find, Sprite, tween } from 'cc';
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";
import { TableZhuanPan } from "db://assets/script/table/TableZhuanPan";
import { BundleName } from '../../../framework/commom/FrameDefine';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { EffWheelArrow } from './EffWheelArrow';
import { UISeven7HistroyContent } from './UISeven7HistroyContent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { oops } from 'db://oops-framework/core/Oops';
import { UIID } from '../../common/GameUIConfig';
import { UIPlayerInfo } from './UIPlayerInfo';
import { Tween } from 'cc';
import { GameGlobal } from '../../common/GameGlobal';
import { AudioPath } from '../Seven7Global';
const { ccclass, property } = _decorator;

@ccclass('Game')
export class Game extends GameComponent {
    @property(EffWheelArrow)
    private effWheelArrow: EffWheelArrow = null;

    @property(UISeven7HistroyContent)
    private gameHistoryView: UISeven7HistroyContent;

    @property(UIPlayerInfo)
    private UIPlayerInfo: UIPlayerInfo;

    @property(Node)
    private wheel: Node;
    @property(Node)
    private wheelItem_1: Node;
    @property(Node)
    private wheelItem_2: Node;
    @property(Node)
    private wheelArrow: Node[] = [];
    @property(Node)
    private shanArr: Node[] = [];

    private wheelAniTime: number = 4;
    private angleOffset = 0;
    private angles: number[] = [0, 40, 80, 120, 160, 200, 240, 280, 320];

    private arrowPointMap = new Map<number, number[]>([
        [1, [0, 2, 4, 7]],
        [3, [1, 3, 6, 8]]
    ]);

    init() {
        var table = JsonUtil.get(TableZhuanPan.TableName);
        if (table == null) {
            return;
        }
        for (let key in table) {
            let nodPath = "item" + key;
            let cfg: TableZhuanPan = table[key];
            let childNode1 = find(nodPath, this.wheelItem_1);
            if (childNode1 != null) {
                let icon = find("icon", childNode1).getComponent(Sprite);
                const rewardPath = `texture/atlas/main/reward_${cfg.RewardID}`;
                super.setSprite(icon, rewardPath, BundleName.SkinDefault);
            }

            let childNode2 = find(nodPath, this.wheelItem_2);
            if (childNode2 != null) {
                let icon = find("icon", childNode2).getComponent(Sprite);
                const rewardPath = `texture/atlas/main/reward_${cfg.RewardID}`;
                super.setSprite(icon, rewardPath, BundleName.SkinDefault);
            }
        }
        this.wheelItem_2.active = false;

        setInterval(() => this.show_glitter_eff(), 600);
    }

    clear() {
        Tween.stopAllByTarget(this.wheel);
        Tween.stopAllByTarget(this.wheelItem_1);
        for (let arrow of this.wheelArrow) {
            Tween.stopAllByTarget(arrow);
        }
        for (let arrow of this.wheelArrow) {
            arrow.active = false;
        }
        this.wheelItem_2.active = false;
    }

    wheelReset() {
        // this.wheelItem.angle = this.Wheel.angle = -resultAnger;
    }

    async startRotate(wheelIndex: number, is77: boolean = false, jp: number[] = []) {
        let resultPoint = wheelIndex;
        let resultPoint2 = resultPoint;
        let resultPoint3 = resultPoint;
        let resultAnger = this.angles[wheelIndex];
        resultAnger += 360 * this.getRandom(6, 8);

        this.wheel.angle = this.angleOffset;
        this.wheelItem_1.angle = this.angleOffset;
        this.wheelItem_2.active = false;

        tween(this.wheel).to(this.wheelAniTime, { angle: -resultAnger }, { easing: 'cubicInOut' }).start();
        tween(this.wheelItem_1).to(this.wheelAniTime, { angle: -resultAnger }, { easing: 'cubicInOut' }).start();

        await new Promise((res, rej) => {
            setTimeout(() => {
                Tween.stopAllByTarget(this.wheel);
                Tween.stopAllByTarget(this.wheelItem_1);
                res(0)
            }, this.wheelAniTime * 1000);
            // var interv = setInterval(() => {
            //     if (breakOut) {
            //         clearInterval(interv);
            //         clearTimeout(timout);
            //         tw1.stop();
            //         tw2.stop();
            //         res(0);
            //     }
            // }, 100)
        })

        this.wheelItem_1.angle = this.wheel.angle = -resultAnger;
        this.wheelItem_2.angle = this.wheelItem_1.angle;
        this.wheelItem_2.active = true;

        this.wheelArrow[0].active = true;
        this.angleOffset = this.wheel.angle % 360;
        //this.gameHistoryView.updateItems(GameModelMgr.seven7Model.getCurRewardID());

        let winNum = GameModelMgr.seven7Model.get_self_win();

        if (is77) {
            await this.effWheelArrow.StartFlash(this.wheelArrow[0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,], 1);
        }

        if (winNum > 0) {
            GameGlobal.playAudio(AudioPath.Reward);
        }

        if (jp.length > 0) {
            GameGlobal.playAudio(AudioPath.BigReward);
            let points = this.arrowPointMap.get(jp[0])!;
            resultPoint2 = this.getArrowPoint(points[this.getRandom(0, points.length - 1)], resultPoint);
            this.wheelArrow[1].active = true;
            this.wheelArrow[1].angle = 180;
            await this.effWheelArrow.StartRotate(this.wheelArrow[1], 0, resultPoint2, 1, 0.5);
            this.wheelArrow[1].angle = 20 - this.effWheelArrow.angles[resultPoint2];
        }

        if (jp.length > 1) {
            await this.effWheelArrow.StartFlash(this.wheelArrow[1], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], 1);
            let points = this.arrowPointMap.get(jp[1])!;
            resultPoint3 = this.getArrowPoint(points[this.getRandom(0, points.length - 1)], resultPoint);
            this.wheelArrow[2].active = true;
            this.wheelArrow[2].angle = 180;
            await this.effWheelArrow.StartRotate(this.wheelArrow[2], resultPoint2, resultPoint3, 1, 0.5);
            this.wheelArrow[2].angle = 20 - this.effWheelArrow.angles[resultPoint3];
        }

        if (winNum > 0) {
            this.UIPlayerInfo.show_coins_add_by_win(winNum);
        }

        await this.delay(1500);
        let errcode = GameModelMgr.seven7Model.get_result_errorcode();
        if(errcode && errcode != 0){
            oops.gui.showErrorCode(errcode);
        }else{
            oops.gui.openAsync(UIID.Seven7UI_CurBetResult);
        }
    }

    private show_glitter_eff() {
        for (let index = 0; index < this.shanArr.length; index++) {
            this.shanArr[index].active = !this.shanArr[index].active;
        }
    }

    private getRandom(mini, maxi) {
        return Math.round(Math.random() * (maxi - mini) + mini);
    }

    private getArrowPoint(wheelPoint: number, resultPoint: number) {
        return (resultPoint - wheelPoint + this.angles.length) % this.angles.length;
    }

    private async delay(ms: number) {
        await new Promise((res) => {
            setTimeout(() => {
                res(0)
            }, ms);
        })
    }
}


