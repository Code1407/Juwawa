import { _decorator, Label, Sprite } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { BundleName } from '../../../framework/commom/FrameDefine';

const { ccclass, property } = _decorator;

@ccclass('UISeven7MyBetRewardItem')
export class UISeven7MyBetRewardItem extends GameComponent {

    @property(Label)
    betNumLabel: Label;

    @property(Sprite)
    rewardIcon: Sprite;

    init(rewardID: number, betNum: number) {
        const rewardPath = `texture/atlas/main/reward_${rewardID}`;
        super.setSprite(this.rewardIcon, rewardPath, BundleName.SkinDefault);
        this.betNumLabel.string = betNum.toLocaleString('en-US');
    }
}


