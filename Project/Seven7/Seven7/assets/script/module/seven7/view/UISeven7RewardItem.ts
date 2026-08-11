import { _decorator, Node, Button, find, EventTouch, SpriteFrame, Sprite, Label } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { TableReward } from "db://assets/script/table/TableReward";
import { BundleName } from '../../../framework/commom/FrameDefine';

const { ccclass, property } = _decorator;

@ccclass('UISeven7RewardItem')
export class UISeven7RewardItem extends GameComponent {
    private cfg: TableReward = null;
    private iconReward: Sprite = null;
    private iconMultiplying: Sprite = null;
    private labelBetWorld: Label = null;
    private labelBetSelf: Label = null;

    private clickFunc: Function = null;

    onLoad(): void {
        this.iconReward = find("icon_reward", this.node).getComponent(Sprite);
        this.iconMultiplying = find("icon_mult", this.node).getComponent(Sprite);
        this.labelBetWorld = find("lb_betWorld", this.node).getComponent(Label);
        this.labelBetSelf = find("lb_betSelf", this.node).getComponent(Label);

        let btn = this.node.getComponent(Button);
        btn.node.on(Node.EventType.TOUCH_START, this.onClickBtn.bind(this))
    }

    init(cfgDta: TableReward, func: Function) {
        if (cfgDta == null) {
            return;
        }
        this.cfg = cfgDta;
        this.clickFunc = func;

        const rewardPath = `texture/atlas/main/bg_reward_${cfgDta.ID}`;
        super.setSprite(this.iconReward, rewardPath, BundleName.SkinDefault);
        const multiplePath = `texture/atlas/main/mult_${cfgDta.Multiple}`;
        super.setSprite(this.iconMultiplying, multiplePath, BundleName.SkinDefault);
    }

    get_id(): number {
        return this.cfg ? this.cfg.ID : 0;
    }

    updateWorldBetNum(num: number) {
        this.labelBetWorld.string = num.toLocaleString();
    }

    updateSlefBetNum(num: number) {
        this.labelBetSelf.string = num.toLocaleString();
    }

    showWorldBet(show:boolean){
        this.labelBetWorld.node.active = show;
    }

    private onClickBtn() {
        if (this.cfg != null && this.clickFunc && typeof this.clickFunc === 'function') {
            this.clickFunc(this.cfg.ID);
        }
    }
}


